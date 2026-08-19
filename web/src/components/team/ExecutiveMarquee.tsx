import type { TeamMemberRef } from "../../../../src/lib/types";
import { PersonCard } from "./PersonCard";

export function ExecutiveMarquee({
  title,
  members,
  direction,
}: {
  title: string;
  members: TeamMemberRef[];
  direction: "ltr" | "rtl";
}) {
  if (members.length === 0) return null;

  const loop = [...members, ...members];

  return (
    <div className="mt-10">
      <h3 className="text-sm font-bold uppercase tracking-[0.25em] text-ink/50">{title}</h3>
      <div className="marquee-mask relative mt-4 overflow-hidden">
        <div
          className={`flex w-max gap-5 ${direction === "ltr" ? "animate-marquee-ltr" : "animate-marquee-rtl"}`}
        >
          {loop.map((m, i) => (
            <div key={`${m.name}-${i}`} className="w-[180px] shrink-0 sm:w-[200px]">
              <PersonCard person={m} showRole={false} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
