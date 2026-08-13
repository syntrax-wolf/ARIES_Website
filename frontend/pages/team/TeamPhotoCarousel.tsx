"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { TeamYear } from "@/lib/types";
import { yearPhotos } from "@/lib/team-photos";

const ACTIVE_SCALE = 0.9;

type Slide = {
  key: string;
  year: string;
  src?: string;
  photoIndex: number;
  photoCount: number;
};

function buildSlides(years: TeamYear[]): Slide[] {
  const slides: Slide[] = [];
  for (const y of years) {
    const photos = yearPhotos(y);
    if (photos.length === 0) {
      slides.push({
        key: `${y.year}-empty`,
        year: y.year,
        src: undefined,
        photoIndex: 0,
        photoCount: 0,
      });
      continue;
    }
    photos.forEach((src, i) => {
      slides.push({
        key: `${y.year}-${i}`,
        year: y.year,
        src,
        photoIndex: i,
        photoCount: photos.length,
      });
    });
  }
  return slides;
}

/**
 * Stacked full-team photo switcher. Years are newest-first (26-27 left, older to the right).
 * Rosters elsewhere use only the newest year.
 */
export function TeamPhotoCarousel({ years }: { years: TeamYear[] }) {
  const slides = useMemo(() => buildSlides(years), [years]);
  const [idx, setIdx] = useState(0);

  const goTo = useCallback(
    (next: number) => setIdx(Math.max(0, Math.min(slides.length - 1, next))),
    [slides.length],
  );

  const goOlder = useCallback(() => goTo(idx + 1), [goTo, idx]);
  const goNewer = useCallback(() => goTo(idx - 1), [goTo, idx]);

  const slide = slides[idx];
  if (!slide) return null;

  const hasOlder = idx < slides.length - 1;
  const hasNewer = idx > 0;
  const caption =
    slide.photoCount > 1
      ? `${slide.year} · ${slide.photoIndex + 1}/${slide.photoCount}`
      : slide.year;

  return (
    <section className="mx-auto max-w-4xl">
      <div
        role="region"
        aria-label="Full team photos"
        className="relative"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" && hasOlder) goOlder();
          if (e.key === "ArrowLeft" && hasNewer) goNewer();
        }}
      >
        <button
          type="button"
          aria-label="Previous team photo"
          disabled={!hasNewer}
          onClick={goNewer}
          className="absolute left-0 top-1/2 z-50 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white text-ink shadow-card transition hover:text-purple disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          aria-label="Next team photo"
          disabled={!hasOlder}
          onClick={goOlder}
          className="absolute right-0 top-1/2 z-50 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white text-ink shadow-card transition hover:text-purple disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight size={20} />
        </button>

        <div
          className="relative mx-12 aspect-[16/9] w-auto sm:mx-14"
          style={{ perspective: "1200px" }}
        >
          {slides.map((s, i) => {
            const offset = i - idx;
            if (offset === 0 || Math.abs(offset) > 2) return null;

            const baseX = offset * 14;
            const scale = 0.86 - Math.abs(offset) * 0.04;
            const opacity = 0.72 - Math.abs(offset) * 0.1;
            const zIndex = 10 - Math.abs(offset);

            return (
              <div
                key={s.key}
                aria-hidden
                className="pointer-events-none absolute inset-0 overflow-hidden bg-[#e6e0d6] shadow-card transition-[transform,opacity] duration-500 ease-out"
                style={{
                  transform: `translateX(${baseX}%) scale(${scale})`,
                  opacity,
                  zIndex,
                }}
              >
                {s.src ? (
                  <Image src={s.src} alt="" fill draggable={false} className="object-cover" />
                ) : (
                  <p className="grid h-full place-items-center px-10 text-center text-lg font-bold uppercase tracking-wide text-[#a49f93] md:text-2xl">
                    Add full team photo for {s.year}
                  </p>
                )}
                <span
                  className={`absolute bottom-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-ink shadow-card-sm ${
                    offset > 0 ? "right-3" : "left-3"
                  }`}
                >
                  {s.year}
                </span>
              </div>
            );
          })}

          <div
            className="absolute inset-0 z-20 overflow-hidden bg-[#e6e0d6] shadow-card transition-transform duration-500 ease-out"
            style={{ transform: `scale(${ACTIVE_SCALE})` }}
          >
            {slide.src ? (
              <Image
                src={slide.src}
                alt={`ARIES full team ${slide.year}`}
                fill
                draggable={false}
                className="object-cover"
                priority
              />
            ) : (
              <p className="grid h-full place-items-center px-10 text-center text-xl font-bold uppercase tracking-wide text-[#a49f93] md:text-3xl">
                Add full team photo for {slide.year}
              </p>
            )}

            {hasNewer && (
              <button
                type="button"
                aria-label="Previous team photo"
                onClick={goNewer}
                className="group absolute left-0 top-0 z-30 h-full w-1/5 cursor-pointer focus-visible:outline-none"
              >
                <span className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/45 group-focus-visible:bg-black/45 group-active:bg-black/45" />
                <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100">
                  <ChevronLeft size={28} className="text-white drop-shadow-md" strokeWidth={2.5} />
                </span>
              </button>
            )}

            {hasOlder && (
              <button
                type="button"
                aria-label="Next team photo"
                onClick={goOlder}
                className="group absolute right-0 top-0 z-30 h-full w-1/5 cursor-pointer focus-visible:outline-none"
              >
                <span className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/45 group-focus-visible:bg-black/45 group-active:bg-black/45" />
                <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100">
                  <ChevronRight size={28} className="text-white drop-shadow-md" strokeWidth={2.5} />
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="mt-5 text-center text-lg font-bold text-ink">{caption}</p>

      {slides.length > 1 && (
        <div className="mt-3 flex justify-center gap-2" aria-label="Select team photo">
          {slides.map((item, i) => (
            <button
              key={item.key}
              type="button"
              aria-label={`View ${item.year} photo ${item.photoIndex + 1}`}
              aria-current={i === idx ? "true" : undefined}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all ${
                i === idx ? "w-7 bg-purple" : "w-2 bg-ink/20 hover:bg-ink/40"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
