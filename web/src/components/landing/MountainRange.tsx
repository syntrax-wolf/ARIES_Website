import type { SVGProps } from "react";

/**
 * Layered mountain silhouette. `depth` selects the tone
 * (0 = far/lightest, 2 = near/darkest).
 */
export function MountainRange({
  depth = 1,
  ...props
}: SVGProps<SVGSVGElement> & { depth?: 0 | 1 | 2 }) {
  const paths = [
    "M0 300 L0 210 L180 150 L340 205 L520 130 L720 200 L900 140 L1120 205 L1300 150 L1440 200 L1440 300 Z",
    "M0 300 L0 180 L160 120 L300 175 L470 90 L640 165 L820 100 L1010 180 L1190 110 L1360 175 L1440 140 L1440 300 Z",
    "M0 300 L0 150 L150 70 L280 140 L430 40 L560 120 L640 24 L760 150 L900 70 L1080 160 L1240 80 L1400 155 L1440 120 L1440 300 Z",
  ];
  const fills = ["rgba(23, 19, 67, 0.28)", "rgba(23, 19, 67, 0.45)", "rgba(13, 10, 36, 0.72)"];

  return (
    <svg
      viewBox="0 0 1440 300"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[depth]} fill={fills[depth]} />
    </svg>
  );
}
