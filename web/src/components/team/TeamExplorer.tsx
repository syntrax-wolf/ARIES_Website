import type { TeamData } from "../../../../src/lib/types";
import { PersonCard } from "./PersonCard";
import { ExecutiveMarquee } from "./ExecutiveMarquee";
import { TeamPhotoCarousel } from "./TeamPhotoCarousel";

export function TeamExplorer({ team }: { team: TeamData }) {
  const roster = team.years[0];
  if (!roster) return null;
  const brain = roster.executives.find((g) => g.group.toUpperCase() === "BRAIN");
  const canvas = roster.executives.find((g) => g.group.toUpperCase() === "CANVAS");

  return (
    <div>
      <TeamPhotoCarousel years={team.years} />

      {roster.coreTeam.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-ink">Core Team</h2>
          <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
            {roster.coreTeam.map((p) => (
              <PersonCard key={p.name + p.role} person={p} showRole />
            ))}
          </div>
        </section>
      )}

      {roster.coordinators.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-ink">Coordinators</h2>
          <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {roster.coordinators.map((p) => (
              <PersonCard key={p.name + p.role} person={p} showRole={false} />
            ))}
          </div>
        </section>
      )}

      {(brain || canvas) && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-ink">Executives</h2>
          {brain && <ExecutiveMarquee title="Brain" members={brain.members} direction="ltr" />}
          {canvas && <ExecutiveMarquee title="Canvas" members={canvas.members} direction="rtl" />}
        </section>
      )}
    </div>
  );
}
