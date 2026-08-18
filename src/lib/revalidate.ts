import { revalidatePath, revalidateTag } from "next/cache";

/** Immediately expire tagged Data Cache entries after a CMS write. */
function bustTag(tag: string) {
  revalidateTag(tag, { expire: 0 });
}

/** Bust ISR + tagged Supabase Data Cache after CMS writes. */
export function revalidateContent(kind?: string, slug?: string) {
  revalidatePath("/", "layout");
  revalidatePath("/(site)", "layout");
  revalidatePath("/account");
  revalidatePath("/admin/editor");

  if (!kind || kind === "projects" || kind === "project") {
    bustTag("projects");
    revalidatePath("/projects");
    if (slug) revalidatePath(`/projects/${slug}`);
  }
  if (!kind || kind === "events" || kind === "event") {
    bustTag("events");
    revalidatePath("/events");
    if (slug) revalidatePath(`/events/${slug}`);
  }
  if (!kind || kind === "members" || kind === "member") {
    bustTag("members");
    bustTag("team");
    bustTag("projects");
    revalidatePath("/team");
    revalidatePath("/projects");
    if (slug) revalidatePath(`/${slug}`);
  }
  if (!kind || kind === "team") {
    bustTag("team");
    bustTag("members");
    revalidatePath("/team");
  }
  if (!kind || kind === "resources" || kind === "resource") {
    bustTag("resources");
    revalidatePath("/resources");
    if (slug) revalidatePath(`/resources/${slug}`);
  }
}
