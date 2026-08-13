import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * ARIES deer logo + wordmark. `tone` picks light (white, for dark surfaces)
 * or dark (navy, for light surfaces). Always links home.
 */
export function AriesLogo({
  tone = "dark",
  stacked = false,
  className,
  href = "/",
}: {
  tone?: "dark" | "light";
  stacked?: boolean;
  className?: string;
  href?: string;
}) {
  const color = tone === "dark" ? "text-navy" : "text-white";
  const logoFilter = tone === "dark"
    ? "brightness(0) saturate(100%) invert(8%) sepia(60%) saturate(4500%) hue-rotate(230deg)"
    : undefined;
  return (
    <Link
      href={href}
      aria-label="ARIES home"
      className={cn(
        "flex items-center gap-3",
        color,
        "hover:!text-current visited:!text-current",
        stacked && "flex-col gap-1.5",
        className,
      )}
    >
      <Image
        src="/images/brand/logo-white.svg"
        alt=""
        width={40}
        height={47}
        className="h-11 w-auto"
        style={logoFilter ? { filter: logoFilter } : undefined}
      />
      <span className={cn("leading-none", color, stacked && "text-center")}>
        <span className="block text-[17px] font-bold tracking-[0.45em]">
          ARIES
        </span>
        <span className="mt-1 block text-[11px] font-bold tracking-[0.3em]">
          IIT DELHI
        </span>
      </span>
    </Link>
  );
}
