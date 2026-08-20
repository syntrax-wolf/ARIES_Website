import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

export function BackToSource({ projectNames }: { projectNames: Record<string, string> }) {
  const [from, setFrom] = useState<string | null>(null);

  useEffect(() => {
    setFrom(new URLSearchParams(window.location.search).get("from"));
  }, []);

  let back: { href: string; label: string } | null = null;
  if (from === "team") back = { href: "/team", label: "Back to Team" };
  else if (from?.startsWith("project:")) {
    const slug = from.slice("project:".length);
    if (projectNames[slug]) {
      back = { href: `/projects/${slug}`, label: `Back to ${projectNames[slug]}` };
    }
  }

  if (!back) return null;
  return (
    <a
      href={back.href}
      className="flex items-center gap-2 rounded-full bg-white/90 px-5 py-2.5 text-sm font-bold text-ink shadow-card-sm backdrop-blur transition-transform hover:scale-105"
    >
      <ArrowLeft size={15} /> {back.label}
    </a>
  );
}
