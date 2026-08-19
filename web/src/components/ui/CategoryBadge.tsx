import { cn } from "../../../../src/lib/utils";
import { colors } from "../../../../src/config/colors";

const { chip } = colors;

const palette: Record<string, { bg: string; fg: string }> = {
  hackathon: chip.teal,
  "industry project": chip.orange,
  publication: chip.purple,
  research: chip.blue,
  "ai / ml": chip.purple,
  blog: chip.orange,
  tutorial: chip.teal,
  course: chip.purple,
  featured: chip.blue,
  talk: chip.purple,
  workshop: chip.teal,
  event: chip.blue,
};

export function CategoryBadge({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const label = typeof children === "string" ? children : String(children ?? "");
  const c = palette[label.toLowerCase()] ?? chip.neutral;
  return (
    <span
      className={cn(
        "inline-block rounded-[5px] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider",
        className,
      )}
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      {label}
    </span>
  );
}
