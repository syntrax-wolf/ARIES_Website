import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, ExternalLink, Link2 } from "lucide-react";
import { getResource, getResources, getSanityBlog, getSanityBlogs } from "@/lib/content";
import { CategoryBadge } from "frontend/shared/ui/CategoryBadge";
import { Markdown } from "frontend/shared/ui/Markdown";
import { SanityBody } from "frontend/shared/ui/SanityBody";
import { authorLabel } from "@/lib/contributors";
import type { SanityBlogResource } from "@/lib/types";

export async function generateStaticParams() {
  const [resources, blogs] = await Promise.all([getResources(), getSanityBlogs()]);
  return [...resources, ...blogs].filter((r) => r.slug).map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resource = await resolveResource(slug);
  return { title: resource?.title ?? "Resource" };
}

async function resolveResource(slug: string) {
  const supabase = await getResource(slug);
  if (supabase) return supabase;
  if (slug.startsWith("blog-")) {
    return getSanityBlog(slug.replace(/^blog-/, ""));
  }
  return undefined;
}

function isSanityResource(r: any): r is SanityBlogResource {
  return r?._sanity === true;
}

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resource = await resolveResource(slug);
  if (!resource) notFound();

  const d = new Date(resource.addedOn + "T00:00:00");
  const dateLabel = d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const authors = resource.authors ?? [];
  const sanity = isSanityResource(resource);
  const hasBody = sanity
    ? (resource._portableTextBody?.length ?? 0) > 0
    : (resource.body ?? "").trim().length > 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(160deg,#f6f1fb_0%,#ece2f7_55%,#e0d2f3_100%)]">
      <div className="glow-circle absolute -right-24 top-40 size-96" />
      <div className="relative mx-auto max-w-[1000px] px-6 pb-20 pt-14 md:px-10">
        <Link
          href="/resources"
          className="inline-flex items-center gap-2 text-sm font-semibold text-purple hover:underline"
        >
          <ArrowLeft size={15} /> All resources
        </Link>

        <h1 className="mt-6 text-4xl font-bold text-[#2b1e6b] md:text-5xl">
          {resource.title}
        </h1>

        <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-ink">
          <span className="flex items-center gap-2">
            <CalendarDays size={16} className="text-purple" /> {dateLabel}
          </span>
          <CategoryBadge>{resource.type}</CategoryBadge>
        </div>

        {authors.length > 0 && (
          <div className="mt-5 text-sm text-ink/70">
            By{" "}
            <span className="font-semibold text-ink">
              {authors.map(authorLabel).join(", ")}
            </span>
          </div>
        )}

        {resource.coverImage && (
          <div className="mt-8 relative aspect-[21/9] w-full overflow-hidden rounded-2xl bg-[#d9d9d9]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resource.coverImage} alt="" className="size-full object-cover" />
          </div>
        )}

        <div className="mt-8 max-w-3xl text-[17px] leading-8 text-[#1c1633]">
          {hasBody ? (
            sanity ? (
              <SanityBody value={resource._portableTextBody!} />
            ) : (
              <Markdown source={resource.body || ""} />
            )
          ) : (
            <p>{resource.description}</p>
          )}
        </div>

        {resource.url && (
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href={resource.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-full bg-navy-2 px-6 py-3 text-sm font-bold text-white shadow-cta transition-transform hover:scale-105"
            >
              {resource.type === "Featured" ? <Link2 size={16} /> : <ExternalLink size={16} />}
              {resource.type === "Featured" ? "Featured link" : "Open resource"}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
