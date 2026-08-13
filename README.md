# archive

Jiung personal Archive Storage — 연구 · 개발 · 경험 · 독서를 한곳에 모은 개인 아카이브.

홈 화면에서 기록을 그리드로 훑어보고, 항목을 누르면 사진·동영상과 본문을 본다.

## 스택 (Board 승인, JIU-5)

- **프런트/배포:** Next.js (App Router) + Vercel
- **데이터·로그인·이미지 저장:** Supabase — *스테이지 ④에서 연동*
- **동영상:** 긴 영상은 YouTube/Vimeo 링크 임베드, 짧은 영상은 직접 업로드

## 현재 상태

**스테이지 ①–③ 완료(읽기 전용).** 홈 그리드 · 카테고리 · 상세 화면이 로컬 샘플 데이터(`lib/content.ts`)로 동작한다.
로그인·작성/수정·미디어 업로드(스테이지 ④, Supabase 연동)는 후속 이슈에서 진행한다.

## 실행

```bash
npm install
npm run dev      # http://localhost:3000
```

빌드/배포:

```bash
npm run build && npm run start
```

## 구조

```
app/
  layout.tsx                 공통 레이아웃 + 카테고리 내비게이션
  page.tsx                   홈 (전체 그리드)
  [category]/page.tsx        카테고리별 목록
  [category]/[slug]/page.tsx 상세 (대표 미디어 + 메타 + 본문 + 갤러리)
  globals.css                미니멀 에디토리얼 다크 테마
components/
  EntryGrid.tsx              카드 그리드
  MediaBlock.tsx             이미지 / 링크 임베드 영상 / 직접 업로드 영상 렌더
lib/
  content.ts                 콘텐츠 타입 + (임시) 샘플 데이터
```

`lib/content.ts` 의 타입(`Category` / `Entry` / `MediaItem`)은 스테이지 ④에서 Supabase 연동 시 그대로 재사용한다. 데이터 소스만 교체하고 화면 컴포넌트는 손대지 않는 것을 목표로 설계했다.

## 로드맵

- [x] ① 리포 초기화 · 기본 레이아웃
- [x] ② 홈 그리드 + 카테고리
- [x] ③ 상세 페이지 + 미디어 렌더(이미지/영상 임베드)
- [ ] ④ Supabase 연동 — 로그인 · 웹 작성/수정 · 미디어 업로드
- [ ] ⑤ 검색 · Updates 사이드바 · 반응형/접근성 마감
