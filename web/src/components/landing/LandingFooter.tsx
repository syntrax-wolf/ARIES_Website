import { ArrowRight } from "lucide-react";
import { AriesLogo } from "../AriesLogo";
import { footerNav } from "../../config/nav";
import { MountainRange } from "./MountainRange";

/**
 * Landing footer from the cinematic redesign: dark navy, mountain silhouette,
 * brand + link columns + newsletter field.
 */
export function LandingFooter() {
  const year = new Date().getFullYear();

  const columns = [
    { heading: "Navigate", links: footerNav.navigate },
    { heading: "Connect", links: footerNav.connect },
    { heading: "Legal", links: footerNav.legal },
  ];

  return (
    <footer className="relative overflow-hidden pt-16" style={{ backgroundColor: "#171343" }}>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-full opacity-40">
        <MountainRange depth={2} className="absolute inset-0 h-full w-full" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1480px] px-6 pb-16 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.6fr]">
          <div className="max-w-xs">
            <AriesLogo tone="light" className="-my-1" />
            <p className="mt-5 text-sm leading-relaxed text-cream/70">
              Building AI beyond the classroom. Together, we learn, build and create impact.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <p className="text-base font-bold text-cream">{col.heading}</p>
              <ul className="mt-5 flex flex-col gap-3.5 text-sm">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-cream/70 transition hover:text-cream">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="text-base font-bold text-cream">Stay in the loop</p>
            <p className="mt-5 text-sm leading-relaxed text-cream/70">
              Get updates on events, projects and opportunities.
            </p>
            <form
              className="mt-5 flex items-center gap-2 rounded-full border border-white/25 bg-white/5 py-1.5 pl-5 pr-1.5"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                required
                placeholder="Enter your email"
                aria-label="Email address"
                className="min-w-0 flex-1 bg-transparent text-sm text-cream placeholder:text-cream/50 focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-cream text-navy transition hover:bg-white sm:h-9 sm:w-9"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        <div className="mt-14 text-center text-sm text-cream/60">
          &copy; {year} Aries, IIT Delhi. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
