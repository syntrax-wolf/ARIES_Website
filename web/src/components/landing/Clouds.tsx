import { useReducedMotion } from "motion/react";

const SKY_ASPECT = 2752 / 1536;

/**
 * The hero sky is a looping video cinemagraph rather than a still plate.
 * `hero-sky.webp` is the poster so it paints immediately and stands in under
 * prefers-reduced-motion.
 */
export function Clouds() {
  const reduce = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden [container-type:size]">
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2"
        style={{
          width: `max(100cqw, calc(100cqh * ${SKY_ASPECT}))`,
          height: `max(100cqh, calc(100cqw / ${SKY_ASPECT}))`,
        }}
      >
        {reduce ? (
          <img
            src="/images/landing/hero-sky.webp"
            alt=""
            width={1920}
            height={1072}
            className="absolute inset-0 h-full w-full select-none object-cover"
            draggable={false}
          />
        ) : (
          <video
            className="absolute inset-0 h-full w-full select-none object-cover"
            poster="/images/landing/hero-sky.webp"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-hidden="true"
            tabIndex={-1}
          >
            <source src="/images/landing/sky-loop.webm" type="video/webm" />
            <source src="/images/landing/sky-loop.mp4" type="video/mp4" />
          </video>
        )}
      </div>
    </div>
  );
}
