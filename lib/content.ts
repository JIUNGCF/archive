// 콘텐츠 데이터 계층.
//
// 지금은 로컬 샘플 데이터로 홈 그리드/카테고리/상세 화면을 구동한다(읽기 전용).
// 스테이지 ④에서 이 파일의 `entries` 소스를 Supabase 조회로 교체하고,
// 타입(Category / MediaItem / Entry)은 그대로 재사용한다. 화면 컴포넌트는 손대지 않는다.

export type Category = "research" | "dev" | "experience" | "reading";

export const CATEGORIES: { key: Category; label: string }[] = [
  { key: "research", label: "연구" },
  { key: "dev", label: "개발" },
  { key: "experience", label: "경험" },
  { key: "reading", label: "독서" },
];

export function categoryLabel(key: Category): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

export function isCategory(value: string): value is Category {
  return CATEGORIES.some((c) => c.key === value);
}

export type MediaItem =
  | { type: "image"; src: string; alt?: string; caption?: string }
  | {
      type: "video";
      // youtube/vimeo 는 링크 임베드(긴 영상), file 은 직접 업로드된 짧은 영상.
      provider: "youtube" | "vimeo" | "file";
      // youtube/vimeo: 영상 ID, file: 파일 URL
      src: string;
      caption?: string;
    };

export interface Entry {
  slug: string;
  category: Category;
  title: string;
  date: string; // ISO (YYYY-MM-DD)
  cover?: string; // 그리드 썸네일 URL
  tags: string[];
  excerpt: string;
  body: string[]; // 문단 배열(임시). 스테이지 ④에서 리치 텍스트로 확장.
  media: MediaItem[]; // media[0] = 상세 대표 미디어
  status: "draft" | "published";
}

// --- 샘플 데이터 (스테이지 ④에서 Supabase 로 교체) ---
const entries: Entry[] = [
  {
    slug: "hello-archive",
    category: "dev",
    title: "이 아카이브를 만든 이유",
    date: "2026-08-13",
    cover:
      "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=1200&q=60",
    tags: ["nextjs", "supabase", "archive"],
    excerpt: "연구·개발·경험·독서를 한곳에 모으는 개인 아카이브의 첫 글.",
    body: [
      "흩어져 있던 기록을 한곳에 모으고 싶었다. 연구 노트, 개발 로그, 경험담, 읽은 책 메모를 각각 다른 곳에 남기다 보니 나중에 다시 찾기가 어려웠다.",
      "그래서 홈 화면에서 전체를 그리드로 훑어보고, 항목을 누르면 사진·동영상과 본문을 보는 구조로 정리하기로 했다.",
      "이 글은 그 첫 화면을 세운 기록이다. 다음 단계에서 웹에서 직접 글을 쓰고 사진·동영상을 올리는 기능을 붙인다.",
    ],
    media: [
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=1600&q=70",
        alt: "책상 위의 노트북과 노트",
        caption: "시작점",
      },
    ],
    status: "published",
  },
  {
    slug: "reading-log-2026",
    category: "reading",
    title: "2026년 상반기에 읽은 책들",
    date: "2026-07-30",
    cover:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&q=60",
    tags: ["독서", "기록"],
    excerpt: "올해 상반기에 읽은 책과 남긴 메모 모음.",
    body: [
      "책을 읽고 나면 인상 깊은 문장과 생각을 짧게 남긴다. 여기 모아 두면 나중에 주제별로 다시 엮기 좋다.",
      "독서 카테고리는 표지 이미지를 썸네일로 쓰고, 본문에는 발췌와 감상을 함께 둔다.",
    ],
    media: [
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1600&q=70",
        alt: "책장에 꽂힌 책들",
      },
    ],
    status: "published",
  },
  {
    slug: "field-research-note",
    category: "research",
    title: "현장 리서치 노트: 관찰에서 질문으로",
    date: "2026-06-18",
    cover:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=60",
    tags: ["research", "method"],
    excerpt: "관찰 기록을 연구 질문으로 좁혀 가는 과정 메모.",
    body: [
      "리서치 초기에는 넓게 관찰하고, 반복해서 나타나는 패턴을 기록한다. 이 노트는 그 패턴을 질문으로 좁혀 가는 과정을 담는다.",
      "연구 카테고리는 메타데이터(출처·방법·기간)를 상세 화면에서 구조화해 보여주는 것을 목표로 한다.",
    ],
    media: [
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1600&q=70",
        alt: "노트와 데이터 차트",
      },
    ],
    status: "published",
  },
  {
    slug: "trip-to-the-coast",
    category: "experience",
    title: "해안 도시에서 보낸 며칠",
    date: "2026-05-02",
    cover:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=60",
    tags: ["여행", "경험"],
    excerpt: "사진과 짧은 영상으로 남긴 여행의 기록.",
    body: [
      "경험 카테고리는 사진과 동영상 비중이 크다. 긴 영상은 유튜브/비메오 링크로 임베드하고, 짧은 클립은 직접 올린다.",
      "아래는 링크 임베드 영상 예시다. 실제 글에서는 본인 영상 링크로 교체하면 된다.",
    ],
    media: [
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=70",
        alt: "해변",
        caption: "도착한 날",
      },
      {
        type: "video",
        provider: "youtube",
        src: "aqz-KE-bpKQ",
        caption: "링크 임베드 영상 예시",
      },
    ],
    status: "published",
  },
];

export function publishedEntries(): Entry[] {
  return entries
    .filter((e) => e.status === "published")
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function entriesByCategory(category: Category): Entry[] {
  return publishedEntries().filter((e) => e.category === category);
}

export function getEntry(category: Category, slug: string): Entry | undefined {
  return entries.find((e) => e.category === category && e.slug === slug);
}
