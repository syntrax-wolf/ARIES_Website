import { cn } from "../../lib/utils";

export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.35em] text-[#14165c]",
        className,
      )}
    >
      <span className="inline-block h-0.5 w-4 bg-[#17178d]" aria-hidden />
      {children}
    </p>
  );
}
