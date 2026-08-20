import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Menu, UserRound, X } from "lucide-react";
import { sidebarLinks } from "../../config/nav";
import { cn } from "../../lib/utils";

/**
 * Collapsible left sidebar for inner pages (not the landing).
 * Desktop: fixed rail. Mobile: hamburger drawer.
 */
export function Sidebar({ currentPath }: { currentPath: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem("aries.sidebar") === "collapsed");
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      localStorage.setItem("aries.sidebar", v ? "open" : "collapsed");
      return !v;
    });
  };

  const isActive = (href: string) =>
    href === "/" ? currentPath === "/" : currentPath === href || currentPath.startsWith(`${href}/`);

  const rail = (narrow: boolean) => (
    <div
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-br-3xl bg-gradient-to-b from-[#02083d] via-[#050944] via-60% to-[#111a64] transition-[width] duration-300",
        narrow ? "w-[76px]" : "w-[210px]",
      )}
    >
      <img
        src="/images/sidebar/night-sky.jpg"
        alt=""
        className="pointer-events-none absolute inset-0 size-full object-cover opacity-70"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#02083d]/60 via-transparent to-[#0a0f3d]/30" />

      <div className="relative z-10 flex h-full flex-col px-4 pb-6 pt-8">
        <a href="/" aria-label="ARIES home" className="flex flex-col items-center gap-2">
          <img
            src="/images/brand/logo-white.svg"
            alt=""
            width={56}
            height={66}
            className={cn("h-14 w-auto transition-all", narrow && "h-10")}
          />
          {!narrow && (
            <span className="text-center leading-none text-white">
              <span className="block text-[19px] font-bold tracking-[0.35em]">ARIES</span>
              <span className="mt-1.5 block text-[11px] font-bold tracking-[0.3em]">IIT DELHI</span>
            </span>
          )}
        </a>

        <nav className="mt-10 flex flex-col gap-1.5">
          {sidebarLinks.map((l) => {
            const active = isActive(l.href);
            const Icon = l.icon;
            return (
              <a
                key={l.href}
                href={l.href}
                title={l.label}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-colors",
                  narrow && "justify-center px-0",
                  active
                    ? "bg-[#e8f0f1] text-[#040851] shadow-[0px_13px_13px_rgba(40,24,160,0.36)]"
                    : "text-[#f5f3ff]/90 hover:bg-white/10",
                )}
              >
                <Icon size={18} className="shrink-0" />
                {!narrow && l.label}
              </a>
            );
          })}
        </nav>

        <a
          href="/admin"
          className={cn(
            "mt-4 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#f5f3ff]/90 transition-colors hover:bg-white/10",
            narrow && "justify-center px-0",
          )}
        >
          <UserRound size={18} />
          {!narrow && "Member Login"}
        </a>

        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="mt-auto hidden items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white lg:flex"
        >
          {collapsed ? (
            <ChevronRight size={18} />
          ) : (
            <>
              <ChevronLeft size={18} /> Collapse
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="sticky top-0 z-30 hidden h-screen shrink-0 py-0 lg:block">{rail(collapsed)}</aside>

      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
        className="fixed left-4 top-4 z-40 rounded-full bg-navy-2 p-3 text-white shadow-cta lg:hidden"
      >
        <Menu size={20} />
      </button>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[240px]">
            {rail(false)}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-3 z-20 rounded-full bg-white/10 p-2 text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
