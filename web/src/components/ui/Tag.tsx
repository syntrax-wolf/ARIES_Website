import { cn } from "../../../../src/lib/utils";

export function Tag({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-full bg-[rgba(17,21,74,0.06)] px-3 py-1 text-xs font-medium text-[#5b5e82]",
        className,
      )}
    >
      {children}
    </span>
  );
}
