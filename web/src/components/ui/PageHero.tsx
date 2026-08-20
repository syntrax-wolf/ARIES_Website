import { Eyebrow } from "./Eyebrow";

export function PageHero({
  eyebrow,
  title,
  accent,
  titleSuffix,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  titleSuffix?: string;
  subtitle?: string;
}) {
  return (
    <div className="pt-14">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-[1.05] text-[#081634] md:text-[54px]">
        {title}
        {accent && (
          <>
            {" "}
            <em className="italic text-[#7160cb]">{accent}</em>
          </>
        )}
        {titleSuffix && ` ${titleSuffix}`}
      </h1>
      {subtitle && (
        <p className="mt-6 max-w-md text-sm leading-6 text-[#384153] md:text-[15px]">{subtitle}</p>
      )}
    </div>
  );
}
