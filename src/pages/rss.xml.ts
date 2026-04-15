import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getBlogPosts, getSiteSettings } from "../lib/sanity";

export async function GET( context: APIContext ) {
  const settings = await getSiteSettings();
  const posts = await getBlogPosts() ?? [];

  return rss({
    title: settings?.siteTitle ?? "Northwest Local Cannabis",
    description: settings?.siteDescription ?? "Washington State licensed cannabis producer and processor.",
    site: context.site!.toString(),
    items: posts.map( ( post: { title: string; slug: { current: string }; description: string; publishedAt: string }) => ({
      title: post.title,
      pubDate: new Date( post.publishedAt ),
      description: post.description,
      link: `/blog/${post.slug.current}/`,
    }) ),
  });
}
