import Link from "next/link";
import { categoryLabel, type Entry } from "@/lib/content";

// 홈/카테고리 공용 카드 그리드 (참고1 레이아웃: 썸네일 + 제목 + 날짜).
export function EntryGrid({ items }: { items: Entry[] }) {
  if (items.length === 0) {
    return <p className="empty">아직 글이 없습니다.</p>;
  }
  return (
    <ul className="grid">
      {items.map((e) => (
        <li key={`${e.category}/${e.slug}`} className="card">
          <Link href={`/${e.category}/${e.slug}`} className="card-link">
            <div className="card-cover">
              {e.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={e.cover} alt="" loading="lazy" />
              ) : (
                <div className="card-cover--empty" />
              )}
            </div>
            <div className="card-meta">
              <span className="tag">{categoryLabel(e.category)}</span>
              <h3 className="card-title">{e.title}</h3>
              <time className="card-date">{e.date}</time>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
