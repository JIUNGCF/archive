/* =========================================================
   POST /api/save
   admin.html 의 "올리기"가 호출한다.
   1) x-archive-key 가 ADMIN_KEY 와 같은지 확인
   2) 사진은 img/ 에, 글은 data.json 에 넣어 GitHub 에 커밋 1회
   필요한 환경변수 (Vercel 프로젝트 설정 → Environment Variables)
     GITHUB_TOKEN   repo 권한이 있는 Personal Access Token
     GITHUB_REPO    예: JIUNGCF/archive
     GITHUB_BRANCH  예: main   (생략하면 main)
     ADMIN_KEY      올리기 때 입력할 비밀번호
   ========================================================= */

const API = 'https://api.github.com';

function gh(path, token, init){
  return fetch(API + path, Object.assign({
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'archive-admin'
    }
  }, init || {}));
}

async function ghJson(path, token, init){
  const r = await gh(path, token, init);
  if (!r.ok) throw new Error(path + ' → ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return r.json();
}

/* admin 은 pages: [{title, text, photos:[{file, data}]}] 를 보낸다.
   예전 형식(figures: [{file, data, title, text}], 사진 1장 = 1페이지)도 받아 준다. */
function pagesOf(post){
  if (Array.isArray(post.pages)) return post.pages;
  return (post.figures || []).map(f => ({ title: f.title, text: f.text, photos: [{ file: f.file, data: f.data }] }));
}

function imgPath(file){ return 'img/' + String(file).replace(/[^a-zA-Z0-9._-]/g, '_'); }

/* 사진은 figures 에 한 줄로 펼치고, 절은 자기 사진 번호를 가진다.
   사진이 1장이면 fig (기존 형식), 여러 장이면 figs 배열 — index.html 이 둘 다 읽는다 */
function toDetail(post){
  const paras = t => String(t || '').split(/\n\s*\n/).map(x => x.trim()).filter(Boolean);
  const figures = [], sections = [];
  pagesOf(post).forEach((pg, i) => {
    const h = pg.title || ('페이지 ' + (i + 1));
    const nums = (pg.photos || []).map(ph => figures.push({ src: imgPath(ph.file), cap: pg.title || '' }) - 1);
    const s = { h };
    if (nums.length === 1) s.fig = nums[0];
    else if (nums.length > 1) s.figs = nums;
    s.p = paras(pg.text);
    sections.push(s);
  });
  return { lede: post.lede || post.sub || '', meta: [], figures, sections, links: [] };
}

function toItem(post){
  return {
    id: post.id, cat: post.cat, date: post.date,
    title: post.title, sub: post.sub || '', meta: post.meta || '',
    cover: post.cover || 'gridnum', tags: post.tags || ''
  };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST'){ res.status(405).end(); return; }

  const { GITHUB_TOKEN, GITHUB_REPO, ADMIN_KEY } = process.env;
  const BRANCH = process.env.GITHUB_BRANCH || 'main';
  if (!GITHUB_TOKEN || !GITHUB_REPO || !ADMIN_KEY){
    res.status(500).json({ error: '환경변수가 비어 있습니다' }); return;
  }
  if (req.headers['x-archive-key'] !== ADMIN_KEY){ res.status(401).end(); return; }

  const post = req.body;
  if (!post || !post.id || !post.title || !/^[a-z0-9-]+$/i.test(post.id)){
    res.status(400).json({ error: 'id 와 title 이 필요하고, id 는 영문·숫자·하이픈만 가능합니다' }); return;
  }

  const T = GITHUB_TOKEN;
  const R = '/repos/' + GITHUB_REPO;

  try {
    /* ---- 현재 브랜치 끝 커밋과 트리 ---- */
    const ref    = await ghJson(R + '/git/ref/heads/' + BRANCH, T);
    const head   = ref.object.sha;
    const commit = await ghJson(R + '/git/commits/' + head, T);

    /* ---- 기존 data.json 읽기 (없으면 빈 틀) ---- */
    let data = { items: [], detail: {} };
    const cur = await gh(R + '/contents/data.json?ref=' + BRANCH, T);
    if (cur.ok){
      const j = await cur.json();
      data = JSON.parse(Buffer.from(j.content, 'base64').toString('utf8'));
      data.items  = data.items  || [];
      data.detail = data.detail || {};
    }

    /* ---- 같은 id 가 있으면 교체, 없으면 맨 앞에 추가 ---- */
    const item = toItem(post);
    const idx  = data.items.findIndex(x => x.id === post.id);
    if (idx >= 0) data.items[idx] = item; else data.items.unshift(item);
    data.detail[post.id] = toDetail(post);

    /* ---- blob 만들기: 사진들 + data.json ---- */
    const tree = [];
    const photos = [].concat(...pagesOf(post).map(pg => pg.photos || []));
    for (const f of photos){
      const m = /^data:([^;]+);base64,(.+)$/.exec(f.data || '');
      if (!m) continue;
      const blob = await ghJson(R + '/git/blobs', T, {
        method: 'POST',
        body: JSON.stringify({ content: m[2], encoding: 'base64' })
      });
      tree.push({ path: imgPath(f.file), mode: '100644', type: 'blob', sha: blob.sha });
    }
    const dataBlob = await ghJson(R + '/git/blobs', T, {
      method: 'POST',
      body: JSON.stringify({ content: JSON.stringify(data, null, 2), encoding: 'utf-8' })
    });
    tree.push({ path: 'data.json', mode: '100644', type: 'blob', sha: dataBlob.sha });

    /* ---- 트리 → 커밋 → 브랜치 이동 (한 번의 커밋) ---- */
    const newTree = await ghJson(R + '/git/trees', T, {
      method: 'POST',
      body: JSON.stringify({ base_tree: commit.tree.sha, tree })
    });
    const newCommit = await ghJson(R + '/git/commits', T, {
      method: 'POST',
      body: JSON.stringify({
        message: (idx >= 0 ? '수정: ' : '추가: ') + post.title + ' (' + post.id + ')',
        tree: newTree.sha,
        parents: [head]
      })
    });
    await ghJson(R + '/git/refs/heads/' + BRANCH, T, {
      method: 'PATCH',
      body: JSON.stringify({ sha: newCommit.sha })
    });

    res.status(200).json({ ok: true, id: post.id, commit: newCommit.sha, images: tree.length - 1 });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
