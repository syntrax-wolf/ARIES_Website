import { clsx, type ClassValue } from "clsx";

/** Merge conditional class names. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** URL slug from a display name (matches scripts/import-from-excel.mjs). */
export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Profile slug for a team or alumni entry — explicit slug wins, else derived from name. */
export function memberProfileSlug(ref: { name: string; slug?: string }): string | undefined {
  const slug = ref.slug ?? slugifyName(ref.name);
  return slug || undefined;
}
