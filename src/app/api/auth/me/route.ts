import { NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/auth-session";

export async function GET() {
  const session = await getSessionInfo();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    memberSlug: session.memberSlug,
    level: session.level,
    name: session.name,
    avatar: session.avatar ?? "",
    email: session.email,
    role: session.level,
  });
}
