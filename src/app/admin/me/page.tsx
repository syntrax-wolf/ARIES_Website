import { redirect } from "next/navigation";

/** Legacy member space → site profile section */
export default function LegacyMeRedirect() {
  redirect("/account");
}
