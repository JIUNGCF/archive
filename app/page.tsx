import { publishedEntries } from "@/lib/content";
import { EntryGrid } from "@/components/EntryGrid";

export default function HomePage() {
  const items = publishedEntries();
  return (
    <section>
      <div className="page-head">
        <h1>Archive</h1>
        <p className="lede">연구 · 개발 · 경험 · 독서의 기록.</p>
      </div>
      <EntryGrid items={items} />
    </section>
  );
}
