import Link from "next/link";
import { notFound } from "next/navigation";
import {
  categoryLabel,
  getEntry,
  isCategory,
  publishedEntries,
} from "@/lib/content";
import { MediaBlock } from "@/components/MediaBlock";

export function generateStaticParams() {
  return publishedEntries().map((e) => ({
    category: e.category,
    slug: e.slug,
  }));
}

export default async function EntryPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  if (!isCategory(category)) notFound();

  const entry = getEntry(category, slug);
  if (!entry || entry.status !== "published") notFound();

  const [hero, ...rest] = entry.media;

  return (
    <article className="entry">
      <header className="entry-head">
        <Link href={`/${entry.category}`} className="tag tag--link">
          {categoryLabel(entry.category)}
        </Link>
        <h1>{entry.title}</h1>
        <div className="entry-meta">
          <time>{entry.date}</time>
          {entry.tags.length > 0 ? (
            <span className="tags">
              {entry.tags.map((t) => `#${t}`).join(" ")}
            </span>
          ) : null}
        </div>
      </header>

      {hero ? (
        <div className="entry-hero">
          <MediaBlock item={hero} />
        </div>
      ) : null}

      <div className="entry-body">
        {entry.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {rest.length > 0 ? (
        <div className="entry-gallery">
          {rest.map((m, i) => (
            <MediaBlock key={i} item={m} />
          ))}
        </div>
      ) : null}
    </article>
  );
}
