"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { topNavLinks } from "@/config/nav";
import { colors } from "@/config/colors";
import { AriesLogo } from "frontend/shared/layout/AriesLogo";
import { UserMenu } from "frontend/shared/layout/UserMenu";
import { cn } from "@/lib/utils";

/**
 * Landing top navbar — fixed, follows you down the page.
 * Clear over the hero; frosted cream bar once you leave it so links
 * stay readable on mist / FAQ frames.
 */
export function TopNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const solid = scrolled || open;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300",
        solid && "shadow-[0_8px_28px_rgba(14,18,57,0.10)] backdrop-blur-md",
      )}
      style={{
        backgroundColor: solid ? `${colors.cream}e0` : "transparent",
      }}
    >
      <div className="mx-auto flex max-w-[1480px] items-center justify-between px-6 py-4 lg:px-10 lg:py-5">
        <AriesLogo tone="dark" />

        <nav className="hidden items-center gap-8 lg:flex">
          {topNavLinks
            .filter((l) => l.href !== "/contact")
            .map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-navy transition-colors hover:text-purple"
              >
                {l.label}
              </Link>
            ))}
          <UserMenu tone="light" />
          <Link
            href="/contact"
            className="rounded-full bg-navy px-7 py-2.5 text-sm font-bold text-white shadow-cta transition-transform hover:scale-105"
          >
            Contact Us →
          </Link>
        </nav>

        <button
          className="rounded-lg p-2 text-navy lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-navy/5 px-4 pb-5 pt-2 lg:hidden">
          {topNavLinks
            .filter((l) => l.href !== "/contact")
            .map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block rounded-lg px-4 py-3 text-base font-semibold text-navy hover:bg-lilac"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          <div className="mt-3 px-2">
            <UserMenu tone="light" />
          </div>
          <Link
            href="/contact"
            className="mt-2 block rounded-full bg-navy px-6 py-3 text-center text-sm font-bold text-white"
            onClick={() => setOpen(false)}
          >
            Contact Us →
          </Link>
        </nav>
      )}
    </header>
  );
}
