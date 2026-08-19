import { canUploadKind } from "../../../../src/lib/permissions.ts";

export const IMAGE_MAX = 2 * 1024 * 1024;
export const VIDEO_MAX = 40 * 1024 * 1024;
const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const VIDEO_EXT = new Set(["mp4", "webm", "mov"]);

export type UploadPlan =
  | { ok: false; error: string }
  | {
      ok: true;
      kind: "image" | "video";
      keys: { small?: string; large?: string; original?: string };
    };

export type MemoryObject = { key: string; bytes: Uint8Array; contentType: string };

export function createMemoryR2() {
  const objects = new Map<string, MemoryObject>();
  return {
    async put(key: string, bytes: Uint8Array, contentType: string) {
      objects.set(key, { key, bytes, contentType });
    },
    async get(key: string) {
      return objects.get(key);
    },
    keys() {
      return [...objects.keys()].sort();
    },
  };
}

export function extensionOf(filename: string) {
  return (filename.split(".").pop() || "").toLowerCase();
}

export function planUpload(input: {
  filename: string;
  size: number;
  kind: string;
  level: string;
}): UploadPlan {
  if (!canUploadKind(input.level, input.kind)) {
    return { ok: false, error: "Not allowed to upload this kind" };
  }
  const ext = extensionOf(input.filename);
  const isImage = IMAGE_EXT.has(ext);
  const isVideo = VIDEO_EXT.has(ext);
  if (!isImage && !isVideo) {
    return { ok: false, error: "unsupported type" };
  }
  if (isImage && input.size > IMAGE_MAX) {
    return { ok: false, error: "image too large" };
  }
  if (isVideo && input.size > VIDEO_MAX) {
    return { ok: false, error: "video too large" };
  }
  const id = `${Date.now()}-upload`;
  if (isImage) {
    return {
      ok: true,
      kind: "image",
      keys: {
        small: `${input.kind}/small-${id}.webp`,
        large: `${input.kind}/large-${id}.webp`,
      },
    };
  }
  return {
    ok: true,
    kind: "video",
    keys: { original: `${input.kind}/video/${id}.${ext}` },
  };
}

export async function storeUpload(
  r2: { put(key: string, bytes: Uint8Array, contentType: string): Promise<void> },
  plan: Extract<UploadPlan, { ok: true }>,
  files: { small?: Uint8Array; large?: Uint8Array; original?: Uint8Array },
) {
  if (plan.keys.small && files.small) {
    await r2.put(plan.keys.small, files.small, "image/webp");
  }
  if (plan.keys.large && files.large) {
    await r2.put(plan.keys.large, files.large, "image/webp");
  }
  if (plan.keys.original && files.original) {
    await r2.put(plan.keys.original, files.original, "application/octet-stream");
  }
}
