/* =========================================================
   POST /api/save
   admin.html 의 "올리기"가 호출한다.
   1) x-archive-key 가 ADMIN_KEY 와 같은지 확인
   2) 요청 종류 (body)
      { check }   비밀번호 확인만 (admin 로그인)
      { list }    지금 data.json + img/ 파일들의 sha (글 목록 · 수정용)
      { img }     사진 한 장 원본 (수정할 때 admin 으로 불러오기)
      { remove }  글 삭제 — 목록 · 본문 · 사진 파일, 커밋 1회
      { blob }    사진 한 장을 GitHub 에 올려 두고 sha 만 돌려준다 (아직 커밋 없음)
                  Vercel 은 요청 하나를 4.5MB 로 막으므로 사진은 한 장씩 따로 받는다
      글          사진(sha 또는 data)은 img/ 에, 글은 data.json 에 넣어 커밋 1회.
                  고치면서 빠진 사진은 지우고, replaces 로 주소를 바꾸면 원래 글을 지운다
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

/* admin 은 pages: [{title, text, photos:[{file, sha}]}] 를 보낸다 (data 를 직접 넣어도 된다).
   예전 형식(figures: [{file, data, title, text}], 사진 1장 = 1페이지)도 받아 준다. */
function pagesOf(post){
  if (Array.isArray(post.pages)) return post.pages;
  return (post.figures || []).map(f => ({ title: f.title, text: f.text, photos: [{ file: f.file, data: f.data }] }));
}

function imgPath(file){ return 'img/' + String(file).replace(/[^a-zA-Z0-9._-]/g, '_'); }

/* 사이트에 적는 사진 주소. 글을 고치면 같은 파일 이름에 다른 사진이 들어갈 수 있어서
   내용의 지문(sha 앞 7자리)을 붙여 둔다 → 방문자 브라우저가 예전 사진을 보여 주지 않는다 */
function imgSrc(file, shas){
  const path = imgPath(file), sha = shas && shas[path];
  return sha ? path + '?v=' + sha.slice(0, 7) : path;
}

/* 사진은 figures 에 한 줄로 펼치고, 절은 자기 사진 번호를 가진다.
   사진이 1장이면 fig (기존 형식), 여러 장이면 figs 배열 — index.html 이 둘 다 읽는다 */
function toDetail(post, shas){
  const paras = t => String(t || '').split(/\n\s*\n/).map(x => x.trim()).filter(Boolean);
  const figures = [], sections = [];
  pagesOf(post).forEach((pg, i) => {
    const h = pg.title || ('페이지 ' + (i + 1));
    const nums = (pg.photos || []).map(ph => figures.push({ src: imgSrc(ph.file, shas), cap: pg.title || '' }) - 1);
    const s = { h };
    if (nums.length === 1) s.fig = nums[0];
    else if (nums.length > 1) s.figs = nums;
    s.p = paras(pg.text);
    sections.push(s);
  });
  return { lede: post.lede || post.sub || '', meta: [], figures, sections, links: [] };
}

/* 사진 표지(cover: 'photo')는 coverFile 이 가리키는 사진을 쓴다. 없으면 첫 사진, 사진이 없으면 기본 표지 */
function toItem(post, shas){
  const item = {
    id: post.id, cat: post.cat, date: post.date,
    title: post.title, sub: post.sub || '', meta: post.meta || '',
    cover: post.cover || 'gridnum', tags: post.tags || ''
  };
  if (item.cover === 'photo'){
    const first = pagesOf(post).map(pg => (pg.photos || [])[0]).find(Boolean);
    const file = post.coverFile || (first && first.file);
    if (file) item.coverSrc = imgSrc(file, shas);
    else item.cover = 'gridnum';
  }
  return item;
}

const SHA = /^[0-9a-f]{40}$/;
function b64(data){ const m = /^data:([^;]+);base64,(.+)$/.exec(data || ''); return m && m[2]; }

/* 지금 브랜치의 data.json (없으면 빈 틀) */
async function readData(R, T, BRANCH){
  const cur = await gh(R + '/contents/data.json?ref=' + BRANCH, T);
  if (!cur.ok) return { items: [], detail: {} };
  const j = await cur.json();
  const data = JSON.parse(Buffer.from(j.content, 'base64').toString('utf8'));
  data.items  = data.items  || [];
  data.detail = data.detail || {};
  return data;
}

/* img/ 폴더의 파일 → blob sha. 수정할 때 바뀌지 않은 사진은 다시 올리지 않고, 빠진 사진은 지우는 데 쓴다 */
async function imgFiles(R, T, treeSha){
  const root = await ghJson(R + '/git/trees/' + treeSha, T);
  const dir = root.tree.find(x => x.path === 'img' && x.type === 'tree');
  if (!dir) return {};
  const sub = await ghJson(R + '/git/trees/' + dir.sha, T);
  const out = {};
  sub.tree.forEach(x => { if (x.type === 'blob') out['img/' + x.path] = x.sha; });
  return out;
}

/* 이 글(id)의 사진 파일 중 keep 에 없는 것을 지우는 트리 항목. admin 이 만드는 이름(id-번호.확장자)만 건드린다 */
function stale(files, id, keep){
  const re = new RegExp('^img/' + id.replace(/[-]/g, '\\-') + '-\\d+\\.[A-Za-z0-9]+$');
  return Object.keys(files).filter(p => re.test(p) && !keep.has(p))
    .map(path => ({ path, mode: '100644', type: 'blob', sha: null }));
}

/* data 를 고치고 사진 트리 항목과 함께 커밋 한 번으로 올린다. change(data, files) → { tree, message } */
async function commitChange(R, T, BRANCH, change){
  const ref    = await ghJson(R + '/git/ref/heads/' + BRANCH, T);
  const head   = ref.object.sha;
  const commit = await ghJson(R + '/git/commits/' + head, T);
  const data   = await readData(R, T, BRANCH);
  const files  = await imgFiles(R, T, commit.tree.sha);
  const { tree, message } = await change(data, files);

  const dataBlob = await ghJson(R + '/git/blobs', T, {
    method: 'POST',
    body: JSON.stringify({ content: JSON.stringify(data, null, 2), encoding: 'utf-8' })
  });
  tree.push({ path: 'data.json', mode: '100644', type: 'blob', sha: dataBlob.sha });

  const newTree = await ghJson(R + '/git/trees', T, {
    method: 'POST',
    body: JSON.stringify({ base_tree: commit.tree.sha, tree })
  });
  const newCommit = await ghJson(R + '/git/commits', T, {
    method: 'POST',
    body: JSON.stringify({ message, tree: newTree.sha, parents: [head] })
  });
  await ghJson(R + '/git/refs/heads/' + BRANCH, T, {
    method: 'PATCH',
    body: JSON.stringify({ sha: newCommit.sha })
  });
  return newCommit.sha;
}

const ID = /^[a-z0-9-]+$/i;
const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };

module.exports = async (req, res) => {
  if (req.method !== 'POST'){ res.status(405).end(); return; }

  const { GITHUB_TOKEN, GITHUB_REPO, ADMIN_KEY } = process.env;
  const BRANCH = process.env.GITHUB_BRANCH || 'main';
  if (!GITHUB_TOKEN || !GITHUB_REPO || !ADMIN_KEY){
    res.status(500).json({ error: '환경변수가 비어 있습니다' }); return;
  }
  if (req.headers['x-archive-key'] !== ADMIN_KEY){ res.status(401).end(); return; }

  const post = req.body;
  const T = GITHUB_TOKEN;
  const R = '/repos/' + GITHUB_REPO;

  /* ---- 비밀번호 확인만 (admin 로그인) ---- */
  if (post && post.check){ res.status(200).json({ ok: true }); return; }

  /* ---- 글 목록 : 배포를 기다리지 않고 GitHub 에서 바로 읽는다. 사진 sha 도 함께 ---- */
  if (post && post.list){
    try {
      const ref    = await ghJson(R + '/git/ref/heads/' + BRANCH, T);
      const commit = await ghJson(R + '/git/commits/' + ref.object.sha, T);
      const data   = await readData(R, T, BRANCH);
      data.files   = await imgFiles(R, T, commit.tree.sha);
      res.status(200).json(data);
    } catch (e) {
      res.status(500).json({ error: String(e.message || e) });
    }
    return;
  }

  /* ---- 사진 한 장 원본 (글을 고칠 때 admin 으로 불러온다) ---- */
  if (post && post.img){
    if (!/^img\/[A-Za-z0-9._-]+$/.test(post.img)){ res.status(400).json({ error: '사진 경로가 아닙니다' }); return; }
    const r = await fetch(API + R + '/contents/' + post.img + '?ref=' + BRANCH, {
      headers: { 'Authorization': 'Bearer ' + T, 'Accept': 'application/vnd.github.raw', 'User-Agent': 'archive-admin' }
    });
    if (!r.ok){ res.status(r.status === 404 ? 404 : 500).json({ error: post.img + ' → ' + r.status }); return; }
    res.setHeader('Content-Type', MIME[post.img.split('.').pop().toLowerCase()] || 'application/octet-stream');
    res.status(200).send(Buffer.from(await r.arrayBuffer()));
    return;
  }

  /* ---- 글 삭제 : 목록 · 본문 · 사진 파일을 함께 지운다 ---- */
  if (post && post.remove){
    const id = String(post.remove);
    if (!ID.test(id)){ res.status(400).json({ error: '주소 형식이 아닙니다' }); return; }
    try {
      let title = id;
      const sha = await commitChange(R, T, BRANCH, async (data, files) => {
        const it = data.items.find(x => x.id === id);
        if (!it && !data.detail[id]) throw new Error(id + ' 글이 없습니다');
        if (it) title = it.title;
        data.items = data.items.filter(x => x.id !== id);
        delete data.detail[id];
        return { tree: stale(files, id, new Set()), message: '삭제: ' + title + ' (' + id + ')' };
      });
      res.status(200).json({ ok: true, id, commit: sha });
    } catch (e) {
      res.status(500).json({ error: String(e.message || e) });
    }
    return;
  }

  /* ---- 사진 한 장 ---- */
  if (post && post.blob){
    const content = b64(post.blob);
    if (!content){ res.status(400).json({ error: '사진 형식이 아닙니다' }); return; }
    try {
      const blob = await ghJson(R + '/git/blobs', T, {
        method: 'POST',
        body: JSON.stringify({ content, encoding: 'base64' })
      });
      res.status(200).json({ sha: blob.sha });
    } catch (e) {
      res.status(500).json({ error: String(e.message || e) });
    }
    return;
  }

  if (!post || !post.id || !post.title || !ID.test(post.id)){
    res.status(400).json({ error: 'id 와 title 이 필요하고, id 는 영문·숫자·하이픈만 가능합니다' }); return;
  }
  /* 고치던 글의 원래 주소. 주소를 바꿔 올리면 원래 글은 지운다 */
  const old = post.replaces && ID.test(post.replaces) && post.replaces !== post.id ? post.replaces : null;

  try {
    let edited = false;
    const sha = await commitChange(R, T, BRANCH, async (data, files) => {
      /* ---- 사진 : 미리 올려 둔 sha, 아니면 data 로 blob 만들기 ---- */
      const tree = [], keep = new Set(), shas = {};
      const photos = [].concat(...pagesOf(post).map(pg => pg.photos || []));
      for (const f of photos){
        let sha = SHA.test(f.sha || '') ? f.sha : null;
        if (!sha){
          const content = b64(f.data);
          if (!content) continue;
          sha = (await ghJson(R + '/git/blobs', T, {
            method: 'POST',
            body: JSON.stringify({ content, encoding: 'base64' })
          })).sha;
        }
        const path = imgPath(f.file);
        keep.add(path);
        shas[path] = sha;
        if (files[path] !== sha) tree.push({ path, mode: '100644', type: 'blob', sha });
      }

      /* ---- 같은 id 가 있으면 그 자리에 교체, 없으면 맨 앞에 추가 ---- */
      const item = toItem(post, shas);
      let idx = data.items.findIndex(x => x.id === post.id);
      if (idx < 0 && old) idx = data.items.findIndex(x => x.id === old);
      edited = idx >= 0;
      if (idx >= 0) data.items[idx] = item; else data.items.unshift(item);
      if (old){
        data.items = data.items.filter(x => x === item || x.id !== old);
        delete data.detail[old];
      }
      data.detail[post.id] = toDetail(post, shas);
      /* ---- 고치면서 빠진 사진 파일은 지운다 ---- */
      tree.push(...stale(files, post.id, keep));
      if (old) tree.push(...stale(files, old, new Set()));

      return { tree, message: (edited ? '수정: ' : '추가: ') + post.title + ' (' + post.id + ')' };
    });

    res.status(200).json({ ok: true, id: post.id, commit: sha });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
