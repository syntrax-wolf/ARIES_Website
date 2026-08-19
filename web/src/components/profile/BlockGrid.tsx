import type { ProfileBlock } from "../../../../src/lib/types";
import { ProfileBlockView } from "./blocks";

export function BlockGrid({ blocks }: { blocks: ProfileBlock[] }) {
  const rows: ProfileBlock[][] = [];
  let pendingHalf: ProfileBlock | null = null;

  for (const b of blocks) {
    if (b.span === "half") {
      if (pendingHalf) {
        rows.push([pendingHalf, b]);
        pendingHalf = null;
      } else {
        pendingHalf = b;
      }
    } else {
      if (pendingHalf) {
        rows.push([pendingHalf]);
        pendingHalf = null;
      }
      rows.push([b]);
    }
  }
  if (pendingHalf) rows.push([pendingHalf]);

  return (
    <div className="space-y-6">
      {rows.map((row, i) =>
        row.length === 2 ? (
          <div key={i} className="grid gap-6 lg:grid-cols-2">
            <ProfileBlockView block={row[0]} />
            <ProfileBlockView block={row[1]} />
          </div>
        ) : (
          <ProfileBlockView key={i} block={row[0]} />
        ),
      )}
    </div>
  );
}
