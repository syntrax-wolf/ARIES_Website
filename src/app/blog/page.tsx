// src/app/blog/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';

interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  mainImage?: any;
  publishedAt: string;
  excerpt?: string;
  body?: any[];
}

// Calculate rough reading time based on body text length
function calculateReadTime(body: any[] = []): number {
  const text = body
    .map((block) => block.children?.map((c: any) => c.text).join(' ') || '')
    .join(' ');
  const wordCount = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

async function getPosts(): Promise<Post[]> {
  const query = `*[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    mainImage,
    publishedAt,
    excerpt,
    body
  }`;
  return await client.fetch(query, {}, { next: { revalidate: 60 } });
}

export default async function BlogPage() {
  const posts = await getPosts();
  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased">
      <main className="max-w-5xl mx-auto px-6 py-16 md:py-24">

        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors group"
          >
            <span className="mr-1.5 transition-transform group-hover:-translate-x-1">←</span>
            Back to Home
          </Link>
        </div>
        
        {/* Editorial Header */}
        <header className="mb-16 border-b border-zinc-100 pb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">
            Writing & Insights
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-4">
            Aries Bits and Bites
          </h1>
          <p className="text-lg text-zinc-500 max-w-xl font-normal leading-relaxed">
            Thoughts on software architecture, artificial intelligence, and building digital products.
          </p>
        </header>

        {posts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-zinc-400">No articles published yet.</p>
          </div>
        ) : (
          <div className="space-y-16">
            
            {/* Featured Post Hero */}
            {featuredPost && (
              <section className="group relative border-b border-zinc-100 pb-16">
                <Link href={`/blog/${featuredPost.slug.current}`} className="block">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    {featuredPost.mainImage && (
                      <div className="md:col-span-7 relative h-[280px] sm:h-[360px] w-full rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200/60">
                        <Image
                          src={urlFor(featuredPost.mainImage).width(1200).height(800).url()}
                          alt={featuredPost.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          priority
                        />
                      </div>
                    )}
                    
                    <div className={featuredPost.mainImage ? 'md:col-span-5' : 'md:col-span-12'}>
                      <div className="flex items-center gap-3 text-xs text-zinc-400 mb-3">
                        <time dateTime={featuredPost.publishedAt}>
                          {new Date(featuredPost.publishedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </time>
                        <span>•</span>
                        <span>{calculateReadTime(featuredPost.body)} min read</span>
                      </div>

                      <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 group-hover:text-zinc-600 transition-colors tracking-tight mb-3">
                        {featuredPost.title}
                      </h2>

                      <p className="text-zinc-600 line-clamp-3 text-sm leading-relaxed mb-6">
                        {featuredPost.excerpt || 'Read the full story to explore insights and detailed breakdowns.'}
                      </p>

                      <span className="inline-flex items-center text-sm font-semibold text-zinc-900 group-hover:translate-x-1 transition-transform">
                        Read Article <span className="ml-1">→</span>
                      </span>
                    </div>
                  </div>
                </Link>
              </section>
            )}

            {/* Grid of Remaining Posts */}
            {remainingPosts.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-8">
                  Recent Articles
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
                  {remainingPosts.map((post) => (
                    <article key={post._id} className="group flex flex-col">
                      <Link href={`/blog/${post.slug.current}`} className="block flex-1">
                        {post.mainImage && (
                          <div className="relative h-48 w-full rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200/60 mb-4">
                            <Image
                              src={urlFor(post.mainImage).width(800).height(500).url()}
                              alt={post.title}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-xs text-zinc-400 mb-2">
                          <time>
                            {new Date(post.publishedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </time>
                          <span>•</span>
                          <span>{calculateReadTime(post.body)} min read</span>
                        </div>

                        <h3 className="text-xl font-bold text-zinc-900 group-hover:text-zinc-600 transition-colors tracking-tight mb-2">
                          {post.title}
                        </h3>

                        {post.excerpt && (
                          <p className="text-zinc-500 text-sm line-clamp-2 leading-relaxed">
                            {post.excerpt}
                          </p>
                        )}
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}
      </main>
    </div>
  );
}