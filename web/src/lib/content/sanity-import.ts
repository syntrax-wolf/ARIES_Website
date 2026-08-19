import type { Resource } from "../../../../src/lib/types.ts";

/** Map a former Sanity post JSON dump onto a Resource. No Sanity client. */
export function resourceFromSanityPost(post: {
  slug: string;
  title: string;
  description?: string;
  publishedAt?: string;
  body?: string;
}): Resource {
  const slug = post.slug.startsWith("blog-") ? post.slug : `blog-${post.slug}`;
  return {
    slug,
    title: post.title,
    description: post.description ?? "",
    type: "Blog",
    addedOn: (post.publishedAt ?? "2024-01-01").slice(0, 10),
    body: post.body ?? "",
  };
}

export function importSanityPosts(posts: Parameters<typeof resourceFromSanityPost>[0][]): Resource[] {
  return posts.map(resourceFromSanityPost);
}
