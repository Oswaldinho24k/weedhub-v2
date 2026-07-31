import type { Route } from "./+types/magazine[.]rss";
import { connectDB } from "~/lib/db.server";
import { ArticleModel } from "~/models/article.server";
import { SITE_URL } from "~/lib/seo";

export async function loader({ request }: Route.LoaderArgs) {
  await connectDB();

  const articles = await ArticleModel.find({ status: "published" })
    .sort({ publishedAt: -1 })
    .limit(20)
    .lean()
    .select("slug title excerpt author publishedAt updatedAt category coverImage");

  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const items = articles
    .map((a) => {
      const url = `${SITE_URL}/magazine/${a.slug}`;
      const pubDate = (a.publishedAt || (a.updatedAt as Date))?.toUTCString() || "";
      return `
    <item>
      <title>${escape(a.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escape(a.excerpt || "")}</description>
      <pubDate>${pubDate}</pubDate>
      <author>noreply@weedhub.info (${escape(a.author?.name || "WeedHub")})</author>
      <category>${escape(a.category)}</category>
      ${a.coverImage ? `<enclosure url="${escape(a.coverImage)}" type="image/jpeg" length="0"/>` : ""}
    </item>`;
    })
    .join("");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>WeedHub Magazine</title>
    <link>${SITE_URL}/magazine</link>
    <description>Artículos sobre cannabis en español — cepas, cultivo, métodos, legislación y cultura.</description>
    <language>es-MX</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/magazine.rss" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/icon.png</url>
      <title>WeedHub</title>
      <link>${SITE_URL}</link>
    </image>${items}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
