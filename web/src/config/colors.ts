/**
 * ARIES brand palette — single source of truth for every hue on the site.
 *
 * Agents: change colors HERE, then mirror any CSS-var renames in
 * `web/src/styles/globals.css` (@theme). Prefer Tailwind tokens (bg-cream, text-ink)
 * over raw hex in components. Use `colors.x` only for inline/JS needs
 * (e.g. CategoryBadge, canvas, SVG fills).
 *
 * Near-duplicates were collapsed: one navy for text+buttons, one cream for
 * light surfaces, one night for dark surfaces.
 */
export const colors = {
  /* Brand core */
  navy: "#03085f", // headings, body on light, primary buttons
  ink: "#03085f", // alias — same as navy (was #07113c)
  purple: "#602bf1", // primary accent
  purpleDeep: "#4711d9", // hover / secondary accent
  purpleSoft: "#7a50ff", // accents on dark surfaces

  /* Surfaces */
  cream: "#fbf4ec", // primary light page background
  mist: "#f3ebf8", // cool lilac-cream alt band (replaces warm peach clash)
  lilac: "#f0e6fa", // chips / soft fills on light
  lilacDeep: "#eadcf7", // FAQ answer / deeper lilac fill
  white: "#ffffff",

  /* Dark */
  night: "#0e1239", // footer / dark frame base
  nightCard: "#171743", // dark card gradient start
  nightDeep: "#0b1035", // dark card gradient end

  /* Supporting */
  teal: "#36d8c7",
  sky: "#9eccfa",
  muted: "#5b5e82", // secondary text on light
  border: "rgba(100, 65, 154, 0.13)",
  borderSoft: "rgba(112, 72, 174, 0.09)",
  divider: "rgba(80, 43, 146, 0.18)",

  /* Category chips (projects / resources / events) */
  chip: {
    teal: { bg: "#dff6f4", fg: "#0a7e82" },
    orange: { bg: "#ffead9", fg: "#c4702a" },
    purple: { bg: "#efe4fb", fg: "#6b35ad" },
    blue: { bg: "#e4e8fb", fg: "#3947b8" },
    rose: { bg: "#fde8ef", fg: "#b83971" },
    neutral: { bg: "rgba(3, 8, 95, 0.06)", fg: "#5b5e82" },
  },
} as const;

export type BrandColor = keyof typeof colors;

/** CSS custom-property map written into :root by globals.css (keep in sync). */
export const cssVars = {
  "--aries-navy": colors.navy,
  "--aries-ink": colors.ink,
  "--aries-purple": colors.purple,
  "--aries-purple-2": colors.purpleDeep,
  "--aries-purple-3": colors.purpleSoft,
  "--aries-cream": colors.cream,
  "--aries-mist": colors.mist,
  "--aries-lilac": colors.lilac,
  "--aries-lilac-2": colors.lilacDeep,
  "--aries-night": colors.night,
  "--aries-night-2": colors.nightCard,
  "--aries-night-3": colors.nightDeep,
  "--aries-teal": colors.teal,
  "--aries-sky": colors.sky,
  "--aries-muted": colors.muted,
} as const;
