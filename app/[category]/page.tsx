import { notFound } from "next/navigation";
import {
  CATEGORIES,
  categoryLabel,
  entriesByCategory,
  isCategory,
} from "@/lib/content";
import { EntryGrid } from "@/components/EntryGrid";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.key }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!isCategory(category)) notFound();

  const items = entriesByCategory(category);
  return (
    <section>
      <div className="page-head">
        <h1>{categoryLabel(category)}</h1>
      </div>
      <EntryGrid items={items} />
    </section>
  );
}
