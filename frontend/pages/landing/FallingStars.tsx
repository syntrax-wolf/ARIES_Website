"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

type Streak = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
  width: number;
  life: number;
  maxLife: number;
  glow: number;
};

type Twinkle = {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
};

function spawnStreak(w: number, h: number, burst: boolean): Streak {
  const x = w * (0.58 + Math.random() * 0.5);
  const y = h * (-0.06 + Math.random() * 0.22);
  const deg = 128 + Math.random() * 16;
  const rad = (deg * Math.PI) / 180;
  const speed = (burst ? 220 : 140) + Math.random() * (burst ? 160 : 120);
  return {
    x,
    y,
    vx: Math.cos(rad) * speed,
    vy: Math.sin(rad) * speed,
    len: burst ? 90 + Math.random() * 130 : 36 + Math.random() * 70,
    width: burst ? 1.5 + Math.random() * 1.5 : 0.8 + Math.random() * 0.8,
    life: 0,
    maxLife: (burst ? 1.15 : 1.6) + Math.random() * 0.7,
    glow: burst ? 1 : 0.9 + Math.random() * 0.1,
  };
}

/**
 * Canvas 2D starfall: top-right → bottom-left streaks + sparse twinkles.
 * Pauses when offscreen, in a hidden tab, or when the user prefers reduced motion.
 */
export function FallingStars() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let visible = true;
    let last = 0;
    let spawnIn = 0.12;
    const streaks: Streak[] = [];
    const twinkles: Twinkle[] = [];
    let cssW = 0;
    let cssH = 0;
    let mobile = false;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const { width, height } = parent.getBoundingClientRect();
      cssW = width;
      cssH = height;
      mobile = width < 720;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      twinkles.length = 0;
      const n = reduce ? (mobile ? 12 : 20) : mobile ? 34 : 64;
      for (let i = 0; i < n; i++) {
        twinkles.push({
          x: width * (0.08 + Math.random() * 0.9),
          y: height * Math.random() * 0.52,
          r: 0.7 + Math.random() * 1.5,
          phase: Math.random() * Math.PI * 2,
          speed: 0.35 + Math.random() * 0.7,
        });
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0.04 },
    );
    io.observe(canvas);

    const drawTwinkles = (dt: number, moving: boolean) => {
      for (const t of twinkles) {
        if (moving) t.phase += t.speed * dt;
        const a = 0.5 + (Math.sin(t.phase) * 0.5 + 0.5) * 0.5;
        ctx.fillStyle = `rgba(255, 250, 240, ${a})`;
        ctx.shadowColor = `rgba(220, 214, 255, ${a * 0.85})`;
        ctx.shadowBlur = t.r * 7;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    if (reduce) {
      const drawStatic = () => {
        ctx.clearRect(0, 0, cssW, cssH);
        drawTwinkles(0, false);
      };
      drawStatic();
      return () => {
        ro.disconnect();
        io.disconnect();
      };
    }

    const tick = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      if (!visible || document.hidden || cssW < 2) {
        last = now;
        return;
      }
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;

      ctx.clearRect(0, 0, cssW, cssH);
      drawTwinkles(dt, true);

      const max = mobile ? 10 : 22;
      spawnIn -= dt;
      if (spawnIn <= 0 && streaks.length < max) {
        const burst = Math.random() < 0.32;
        streaks.push(spawnStreak(cssW, cssH, burst));
        spawnIn = mobile ? 0.32 + Math.random() * 0.55 : 0.1 + Math.random() * 0.28;
      }

      for (let i = streaks.length - 1; i >= 0; i--) {
        const s = streaks[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life += dt;

        const fadeIn = Math.min(1, s.life / 0.18);
        const fadeOut = 1 - Math.max(0, (s.life - s.maxLife * 0.62) / (s.maxLife * 0.38));
        const fade = Math.max(0, fadeIn * fadeOut);
        const mag = Math.hypot(s.vx, s.vy) || 1;
        const tx = s.x - (s.vx / mag) * s.len;
        const ty = s.y - (s.vy / mag) * s.len;

        const grad = ctx.createLinearGradient(tx, ty, s.x, s.y);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(0.45, `rgba(230, 224, 255, ${0.5 * fade * s.glow})`);
        grad.addColorStop(1, `rgba(255, 253, 248, ${1 * fade * s.glow})`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = s.width;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();

        /* Bloom around the leading head so the streak reads as a light source */
        ctx.shadowColor = `rgba(200, 190, 255, ${0.9 * fade * s.glow})`;
        ctx.shadowBlur = 16 + s.width * 9;
        ctx.fillStyle = `rgba(255, 255, 252, ${fade * s.glow})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.width * 1.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (s.life > s.maxLife || s.y > cssH * 0.78 || s.x < -80) {
          streaks.splice(i, 1);
        }
      }
    };

    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [reduce]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-[2] mix-blend-screen"
      aria-hidden="true"
    />
  );
}