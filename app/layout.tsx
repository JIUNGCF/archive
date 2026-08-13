import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES } from "@/lib/content";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jiung · Archive",
  description: "연구 · 개발 · 경험 · 독서를 모은 개인 아카이브",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <header className="site-header">
          <Link href="/" className="brand">
            Jiung <span>Archive</span>
          </Link>
          <nav className="site-nav">
            <Link href="/">전체</Link>
            {CATEGORIES.map((c) => (
              <Link key={c.key} href={`/${c.key}`}>
                {c.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="site-main">{children}</main>
        <footer className="site-footer">
          Jiung · Archive — 연구 · 개발 · 경험 · 독서
        </footer>
      </body>
    </html>
  );
}
