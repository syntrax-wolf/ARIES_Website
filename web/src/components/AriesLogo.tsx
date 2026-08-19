import { cn } from "../../../src/lib/utils";

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
  const onLight = tone === "dark";
  const color = onLight
    ? "text-navy hover:text-navy focus:text-navy visited:text-navy"
    : "text-white hover:text-white focus:text-white visited:text-white";

  return (
    <a
      href={href}
      aria-label="ARIES home"
      className={cn(
        "flex items-center gap-3 no-underline",
        color,
        stacked && "flex-col gap-1.5",
        className,
      )}
    >
      <img
        src={onLight ? "/images/brand/logo-navy.svg" : "/images/brand/logo-white.svg"}
        alt=""
        width={40}
        height={47}
        className="h-11 w-auto"
      />
      <span className={cn("leading-none", stacked && "text-center")}>
        <span className="block text-[17px] font-bold tracking-[0.45em]">ARIES</span>
        <span className="mt-1 block text-[11px] font-bold tracking-[0.3em]">IIT DELHI</span>
      </span>
    </a>
  );
}
