"use client";

import Image from "next/image";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { urlFor } from "@/sanity/lib/image";

const components: PortableTextComponents = {
  types: {
    image: ({ value }: any) => {
      if (!value?.asset?._ref) return null;
      return (
        <figure className="my-8">
          <div className="relative h-80 w-full overflow-hidden rounded-2xl bg-[#d9d9d9]">
            <Image
              src={urlFor(value).width(1200).height(800).url()}
              alt={value.alt || ""}
              fill
              className="object-cover"
            />
          </div>
          {value.caption && (
            <figcaption className="mt-2 text-center text-xs text-ink/50">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
  },
  block: {
    h1: ({ children }) => (
      <h1 className="mt-8 mb-4 text-2xl font-bold text-ink">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="mt-7 mb-3 text-xl font-bold text-ink">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-6 mb-2 text-lg font-bold text-ink">{children}</h3>
    ),
    normal: ({ children }) => (
      <p className="mb-4 leading-7 text-ink/90">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mb-4 border-l-4 border-purple pl-4 italic text-ink/70">
        {children}
      </blockquote>
    ),
  },
  marks: {
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    code: ({ children }) => (
      <code className="rounded-md bg-[#efe9fb] px-1.5 py-0.5 text-sm font-mono text-purple">
        {children}
      </code>
    ),
    link: ({ value, children }) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noreferrer"
        className="font-semibold text-purple underline hover:text-purple-2"
      >
        {children}
      </a>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mb-4 list-disc space-y-1 pl-6 text-ink/90">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="mb-4 list-decimal space-y-1 pl-6 text-ink/90">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li className="leading-7">{children}</li>,
    number: ({ children }) => <li className="leading-7">{children}</li>,
  },
};

export function SanityBody({ value }: { value: any[] }) {
  return <PortableText value={value} components={components} />;
}
