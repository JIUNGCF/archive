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
3. 비밀번호 입력 (브라우저를 닫을 때까지 기억함)
4. 1~2분 뒤 사이트에 반영

## 로컬에서 확인할 때

- `index.html` 을 더블클릭하면 **data.json 을 읽지 못한다** (브라우저 보안)
- VS Code 에서 **Live Server** 확장으로 열거나, 터미널에서 `python -m http.server` 를 띄운 뒤 `localhost:8000` 으로 연다
- 로컬에서는 올리기가 서버에 닿지 않으므로 JSON 파일로 내려받아진다

## 알아둘 것

- 사진은 올리기 전에 긴 변 2000px, JPEG 로 자동 축소된다 (작은 PNG 는 그대로)
- 한 번에 올리는 사진 합계는 **4MB 이하**여야 한다. 넘으면 나눠 올린다
- 같은 주소(id)로 다시 올리면 **덮어쓴다**. 수정할 때 쓰면 된다
- `admin.html` 주소 자체를 숨기려면 Vercel → Settings → Deployment Protection 을 켠다 (유료 기능일 수 있음)
