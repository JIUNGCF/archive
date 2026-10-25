# 아카이브 설정 안내

## 파일 구성

```
archive/
├─ index.html     아카이브 화면 (누구나)
├─ admin.html     글쓰기 화면 (올리기에 비밀번호 필요)
├─ data.json      글 목록과 본문 — admin 이 자동으로 갱신
├─ img/           사진 — admin 이 자동으로 넣음
├─ api/save.js    서버 함수 — 비밀번호 확인 후 GitHub 에 커밋
└─ SETUP.md       이 문서
```

## 처음 한 번만 하는 설정

1. **GitHub 토큰 발급**
   GitHub → Settings → Developer settings → Personal access tokens → Fine-grained token
   - Repository access: `archive` 하나만
   - Permissions → Contents: **Read and write**
   - 만들어진 토큰 문자열을 복사해 둔다 (다시 볼 수 없음)

2. **Vercel 프로젝트 만들기**
   vercel.com → Add New → Project → `JIUNGCF/archive` 선택 → Framework Preset 은 **Other**

3. **환경변수 4개 등록**
   Vercel 프로젝트 → Settings → Environment Variables

   | 이름 | 값 |
   |---|---|
   | `GITHUB_TOKEN` | 1번에서 만든 토큰 |
   | `GITHUB_REPO` | `JIUNGCF/archive` |
   | `GITHUB_BRANCH` | `main` |
   | `ADMIN_KEY` | 올리기 때 쓸 비밀번호 (직접 정함) |

4. **Deploy** 를 누른다. 끝나면 `https://<프로젝트명>.vercel.app` 주소가 생긴다.

## 글 올리기

1. `https://<프로젝트명>.vercel.app/admin.html` 접속
2. 제목·사진·글을 쓰고 **올리기**
3. 위쪽 바의 **비밀번호** 칸에 입력 (맞으면 브라우저를 닫을 때까지 기억하고 칸이 사라짐)
4. 1~2분 뒤 사이트에 반영

## 로컬에서 확인할 때

- `index.html` 을 더블클릭하면 **data.json 을 읽지 못한다** (브라우저 보안)
- VS Code 에서 **Live Server** 확장으로 열거나, 터미널에서 `python -m http.server` 를 띄운 뒤 `localhost:8000` 으로 연다
- 로컬에서는 올리기가 서버에 닿지 않으므로 JSON 파일로 내려받아진다

## 알아둘 것

- 사진 한 장이 한 페이지가 된다. 한 페이지에 여러 장을 넣으면 사이트에서 그 페이지 안에서 좌우로 넘겨 본다
  - 넣을 때 **한 번에 넣은 사진을 한 페이지로 묶기** 를 켜거나
  - 오른쪽의 **+ 사진** (또는 큰 사진 위로 끌어다 놓기) 으로 지금 페이지에 더하거나
  - 왼쪽 목록의 **⤒** 로 위 페이지와 합치거나, 사진을 왼쪽의 다른 페이지 위로 끌어다 놓는다. 다시 나누려면 사진 아래 **떼기**
- 순서는 끌어서 바꾼다. 페이지는 위아래로, 페이지 안의 사진은 좌우로
- 표지에서 **사진** 을 고르면 아래에 넣은 사진들이 뜨고, 그중 하나를 대표 사진으로 고른다
- 사진은 올리기 전에 긴 변 2000px, JPEG 로 자동 축소된다 (작은 PNG 는 그대로)
- 사진은 한 장씩 따로 올라가고 마지막에 커밋 한 번으로 묶인다. 장수 제한은 없다
  - 도중에 실패하면 다시 **올리기** 를 누른다. 이미 올라간 사진은 건너뛴다
  - 한 장이 줄인 뒤에도 약 3MB 를 넘으면 (JPEG 로 바꿀 수 없는 형식 등) 막힌다
- 쓰던 글은 사진까지 브라우저에 자동 저장된다. 새로고침하거나 창을 닫았다 열어도 그대로 돌아온다
  - 올리기에 성공하면 비워진다. 직접 비우려면 위쪽 바의 **새 글** 을 두 번 누른다
  - 브라우저와 주소마다 따로 저장된다. `file://` 로 연 admin 과 vercel.app 의 admin 은 서로 다른 초안이다
- 같은 주소(id)로 다시 올리면 **덮어쓴다**. 수정할 때 쓰면 된다
- `admin.html` 주소 자체를 숨기려면 Vercel → Settings → Deployment Protection 을 켠다 (유료 기능일 수 있음)
