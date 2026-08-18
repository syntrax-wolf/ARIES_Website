import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getSessionInfo } from "@/lib/auth-session";
import { canUploadKind } from "@/lib/roles";

const KINDS = new Set(["members", "projects", "events", "team", "misc"]);
const IMAGE_MAX = 8 * 1024 * 1024;
const VIDEO_MAX = 40 * 1024 * 1024;

const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const VIDEO_EXT = new Set(["mp4", "webm", "mov"]);

export async function POST(req: Request) {
  const session = await getSessionInfo();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") ?? "misc");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }
  if (!KINDS.has(kind) || !canUploadKind(session.level, kind)) {
    return NextResponse.json({ error: "invalid kind" }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const isImage = IMAGE_EXT.has(ext);
  const isVideo = VIDEO_EXT.has(ext);
  if (!isImage && !isVideo) {
    return NextResponse.json(
      { error: "unsupported type (images: jpg/png/webp/gif; video: mp4/webm/mov)" },
      { status: 400 },
    );
  }
  if (isImage && file.size > IMAGE_MAX) {
    return NextResponse.json({ error: "image too large (max 8MB)" }, { status: 400 });
  }
  if (isVideo && file.size > VIDEO_MAX) {
    return NextResponse.json({ error: "video too large (max 40MB — keep clips short)" }, { status: 400 });
  }

  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  const path = `${kind}/${isVideo ? "video/" : ""}${filename}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const contentType =
    file.type ||
    (isVideo
      ? ext === "mov"
        ? "video/quicktime"
        : `video/${ext}`
      : `image/${ext === "jpg" ? "jpeg" : ext}`);

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.storage.from("media").upload(path, buf, {
    contentType,
    upsert: false,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("media").getPublicUrl(path);

  return NextResponse.json({ ok: true, url: publicUrl, type: isVideo ? "video" : "image" });
}
