import { useState } from "react";
import { Upload, X } from "lucide-react";

type MediaKind = "members" | "projects" | "events" | "team" | "misc";

async function blobToWebp(file: File, width: number): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, width / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("WebP encode failed"))), "image/webp", 0.82);
  });
  return new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" });
}

export function MediaField({
  label,
  kind,
  value,
  onChange,
  accept = "image",
}: {
  label: string;
  kind: MediaKind;
  value?: string;
  onChange: (url: string) => void;
  accept?: "image" | "video" | "both";
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptAttr =
    accept === "video"
      ? "video/mp4,video/webm,video/quicktime"
      : accept === "both"
        ? "image/*,video/mp4,video/webm,video/quicktime"
        : "image/*";

  const isVideo =
    !!value &&
    (/\.(mp4|webm|mov)(\?|$)/i.test(value) || value.includes("/video") || value.includes("video/"));

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("kind", kind);
      if (file.type.startsWith("image/")) {
        const small = await blobToWebp(file, 400);
        const large = await blobToWebp(file, 1200);
        body.append("small", small);
        body.append("large", large);
        body.append("file", large);
      } else {
        body.append("file", file);
      }
      const res = await fetch("/api/admin/upload", { method: "POST", body, credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onChange(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <span className="text-xs font-semibold text-ink">{label}</span>
      <div className="mt-1.5 flex flex-wrap items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-ink/20 bg-[#f3eef8] px-3 py-2.5 text-xs font-semibold text-ink hover:border-purple/40">
          <Upload size={14} />
          {busy ? "Uploading…" : accept === "video" ? "Choose video" : "Choose file"}
          <input
            type="file"
            accept={acceptAttr}
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
            }}
          />
        </label>
        {value && isVideo && (
          <video src={value} className="h-12 w-20 rounded-lg object-cover bg-lilac" muted />
        )}
        {value && !isVideo && (
          <img src={value} alt="" className="size-12 rounded-lg object-cover bg-lilac" />
        )}
        {value && (
          <button type="button" onClick={() => onChange("")} className="text-ink/40 hover:text-ink">
            <X size={14} />
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
