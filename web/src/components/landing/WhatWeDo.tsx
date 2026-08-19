import { Users, CalendarDays, Rocket, Handshake } from "lucide-react";

const items = [
  {
    icon: "/images/landing/icon-ship.svg",
    label: "Shipping cool projects",
    href: "/projects",
  },
  {
    icon: "/images/landing/icon-discuss.svg",
    label: "Discussing Interesting Topics",
    href: "/events",
  },
  {
    icon: "/images/landing/icon-events.svg",
    label: "Hosting Industry Events",
    href: "/events",
  },
  {
    icon: "/images/landing/icon-research.svg",
    label: "Researching cool stuff",
    href: "/projects",
  },
] as const;

const stats = [
  { icon: Users, value: "3000+", label: "Students Reached" },
  { icon: CalendarDays, value: "50+", label: "Events Conducted" },
  { icon: Rocket, value: "20+", label: "Projects Built" },
  { icon: Handshake, value: "10+", label: "Industry Collaborations" },
] as const;

export function WhatWeDo() {
  return (
    <section className="landing-frame flex flex-col justify-center overflow-hidden bg-mist">
      <div className="glow-circle absolute -left-40 top-10 size-[384px]" />
      <div className="glow-circle absolute -right-40 bottom-20 size-[384px]" />
      <div className="decor-ring absolute -left-32 -top-20 size-[280px]" />

      <div className="relative mx-auto grid w-full max-w-[1400px] flex-1 content-center gap-10 px-6 py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-12 lg:py-20">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.06em] text-purple">
            <span className="mr-2 inline-block h-[3px] w-9 translate-y-[-4px] bg-purple" aria-hidden />
            What we do
          </p>
          <h2 className="mt-5 text-4xl font-black leading-tight text-ink md:text-[44px]">
            More than a club, a track record you can{" "}
            <span className="whitespace-nowrap text-purple-2 md:text-[50px]">Ctrl+ F</span>
          </h2>

          <div className="mt-8 space-y-4">
            {items.map((it) => (
              <a
                key={it.label}
                href={it.href}
                className="group flex items-center gap-5 rounded-2xl border border-purple/10 bg-white/80 p-4 shadow-card transition-transform hover:-translate-y-0.5"
              >
                <span className="purple-icon-gradient grid size-[64px] shrink-0 place-items-center overflow-hidden rounded-2xl md:size-[76px]">
                  <img src={it.icon} alt="" width={76} height={76} className="size-full" />
                </span>
                <h3 className="flex-1 text-lg font-extrabold text-ink md:text-[20px]">{it.label}</h3>
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-lilac text-2xl font-light text-purple transition-transform group-hover:translate-x-1 md:size-[52px] md:text-[34px]">
                  →
                </span>
              </a>
            ))}
          </div>
        </div>

        <aside className="relative self-center rounded-[30px] bg-gradient-to-br from-night-2 to-night-3 px-8 py-10 text-white shadow-[0px_27px_21px_rgba(21,14,65,0.2)] md:px-12 md:py-12">
          <div className="glow-circle absolute -bottom-16 -right-10 size-72 opacity-80" />
          <p className="text-5xl font-bold leading-none md:text-[72px]">Aries</p>
          <p className="mt-5 text-2xl font-black text-purple-3 md:text-[34px]">noun</p>
          <p className="mt-3 text-base text-white/95 md:text-xl">
            /&rsquo;er-ēz/ • &lsquo;e-, &lsquo;ēz-, &lsquo;ār-ēz, -rēz/
          </p>
          <hr className="mt-6 border-white/20" />
          <p className="mt-6 text-base leading-relaxed md:text-lg md:leading-8">
            The first sign of the zodiac in astrology, characterised by an absolute courage and immense
            ambition. The Aries mind strives for prominence in every project it undertakes.
          </p>
          <hr className="mt-6 border-white/20" />
          <ul className="mt-6 space-y-4 text-base md:text-lg">
            {[
              "A student-led AI research and engineering collective",
              "Founded at IIT Delhi",
              "Driven by curiosity, powered by collaboration",
            ].map((line) => (
              <li key={line} className="flex gap-4">
                <span className="mt-2.5 inline-block h-[3px] w-5 shrink-0 bg-purple-3" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <div className="relative mx-auto w-full max-w-[1250px] px-6 pb-16 lg:px-12">
        <div className="grid grid-cols-2 divide-purple/20 rounded-[27px] border border-purple/15 bg-white/75 py-8 shadow-stat md:grid-cols-4 md:divide-x">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-2.5 px-4 py-3 text-center">
              <s.icon size={36} strokeWidth={1.5} className="text-purple" />
              <p className="text-3xl font-black text-ink md:text-4xl">{s.value}</p>
              <p className="text-sm font-semibold text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
