// src/app/blog/[slug]/page.tsx
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PortableText } from '@portabletext/react';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';

interface Post {
  title: string;
  publishedAt: string;
  mainImage?: any;
  body: any;
}

// Custom serializers for PortableText (clean imagery & code blocks inside article body)
const portableTextComponents = {
  types: {
    image: ({ value }: any) => {
      if (!value?.asset?._ref) return null;
      return (
        <figure className="my-10">
          <div className="relative h-96 w-full rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200/60">
            <Image
              src={urlFor(value).width(1200).height(800).url()}
              alt={value.alt || 'Article image'}
              fill
              className="object-cover"
            />
          </div>
          {value.caption && (
            <figcaption className="text-center text-xs text-zinc-400 mt-3">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
  },
};

async function getPost(slug: string): Promise<Post | null> {
  const query = `*[_type == "post" && slug.current == $slug][0] {
    title,
    publishedAt,
    mainImage,
    body
  }`;
  return await client.fetch(query, { slug }, { next: { revalidate: 60 } });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased">
      <main className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        
        {/* Navigation Back Link */}
        <div className="mb-10">
          <Link
            href="/blog"
            className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-900 transition-colors"
          >
            ← Back to all posts
          </Link>
        </div>

        {/* Article Header */}
        <header className="mb-10">
          {post.publishedAt && (
            <time className="block text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
          )}

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-zinc-900 leading-[1.15] mb-6">
            {post.title}
          </h1>
        </header>

        {/* Featured Cover Image */}
        {post.mainImage && (
          <div className="relative h-72 sm:h-[420px] w-full mb-12 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200/60">
            <Image
              src={urlFor(post.mainImage).width(1400).height(800).url()}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Rich Text Body Content */}
        <article className="prose prose-zinc max-w-none prose-headings:tracking-tight prose-headings:font-bold prose-a:text-zinc-900 prose-a:underline hover:prose-a:text-zinc-600 prose-img:rounded-lg">
          {post.body && (
            <PortableText value={post.body} components={portableTextComponents} />
          )}
        </article>

        {/* Footer / Divider */}
        <hr className="my-16 border-zinc-100" />

        {/* Comment Section Placeholder */}
        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 mb-6">
            Comments
          </h2>
          <div className="p-8 border border-dashed border-zinc-200 rounded-xl text-center bg-zinc-50/50">
            <p className="text-sm text-zinc-500">
              Comment section is currently unavailable.
            </p>
          </div>
        </section>

      </main>
    </div>
  );
}