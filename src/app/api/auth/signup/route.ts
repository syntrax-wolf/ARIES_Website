import { NextResponse } from "next/server";

/** Password signup is retired. Members sign in with IIT Delhi (DevClub). */
export async function POST() {
  return NextResponse.json(
    { error: "Signup codes are retired. Sign in with IIT Delhi from /admin." },
    { status: 410 },
  );
}
