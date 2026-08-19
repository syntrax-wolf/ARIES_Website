import type { TeamMemberRef } from "../../../../src/lib/types";
import { memberProfileSlug } from "../../../../src/lib/utils";

export function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function PersonCard({
  person,
  from = "team",
  showRole = true,
}: {
  person: TeamMemberRef;
  from?: string;
  showRole?: boolean;
}) {
  const slug = memberProfileSlug(person);

  const inner = (
    <article className="group overflow-hidden rounded-2xl bg-white shadow-card-sm transition-transform hover:-translate-y-1">
      <div className="relative grid h-44 place-items-center bg-[linear-gradient(135deg,#ded7f6_0%,#c9bdf0_100%)]">
        {person.photo ? (
          <img src={person.photo} alt={person.name} className="absolute inset-0 size-full object-cover" />
        ) : (
          <span className="grid size-16 place-items-center rounded-full bg-navy-2 text-xl font-bold text-white">
            {initialsOf(person.name)}
          </span>
        )}
      </div>
      <div className="px-4 py-4 text-center">
        <h3 className="truncate text-sm font-bold text-ink">{person.name}</h3>
        {showRole && (
          <span className="mt-2 inline-block rounded-full bg-lilac px-3 py-1 text-[11px] font-bold text-purple">
            {person.role}
          </span>
        )}
      </div>
    </article>
  );

  return slug ? <a href={`/${slug}?from=${from}`}>{inner}</a> : inner;
}
