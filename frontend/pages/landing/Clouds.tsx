"use client";

import { useReducedMotion } from "motion/react";

const SKY_ASPECT = 2752 / 1536;

/**
 * The hero sky is a looping video cinemagraph rather than a still plate — the
 * painted clouds billow and the light shimmers. `hero-sky.png` is shipped as
 * the poster so it renders instantly, covers the video while it buffers, and
 * stands in if playback is blocked or refused (or under prefers-reduced-motion).
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
            src="/images/landing/hero-sky.png"
            alt=""
            fetchPriority="high"
            className="absolute inset-0 h-full w-full select-none object-cover"
            draggable={false}
          />
        ) : (
          <video
            className="absolute inset-0 h-full w-full select-none object-cover"
            poster="/images/landing/hero-sky.png"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
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