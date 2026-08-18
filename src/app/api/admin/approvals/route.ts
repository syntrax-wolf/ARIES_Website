import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { canApprove, isLeadership } from "@/lib/roles";
import { revalidateContent } from "@/lib/revalidate";
import { getSessionInfo } from "@/lib/auth-session";

async function requireApprover() {
  const session = await getSessionInfo();
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!canApprove(session.level) && !isLeadership(session.level)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  const supabase = await createSupabaseServerClient();
  const db = createSupabaseServiceClient();
  return { supabase, db, session };
}

export async function GET() {
  const gate = await requireApprover();
  if ("error" in gate && gate.error) return gate.error;
  const { db } = gate as Awaited<ReturnType<typeof requireApprover>> & {
    db: ReturnType<typeof createSupabaseServiceClient>;
  };

  const [{ data: requests }, { data: log }] = await Promise.all([
    db
      .from("change_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    db
      .from("change_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return NextResponse.json({ requests: requests ?? [], log: log ?? [] });
}

export async function POST(req: Request) {
  const gate = await requireApprover();
  if ("error" in gate && gate.error) return gate.error;
  const { supabase, db } = gate as Awaited<ReturnType<typeof requireApprover>> & {
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
    db: ReturnType<typeof createSupabaseServiceClient>;
  };

  const body = (await req.json()) as {
    requestId?: string;
    approve?: boolean;
    note?: string;
  };
  if (!body.requestId || typeof body.approve !== "boolean") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { data: pending } = await db
    .from("change_requests")
    .select("entity_type, entity_slug")
    .eq("id", body.requestId)
    .maybeSingle();

  const { data, error } = await supabase.rpc("review_change_request", {
    request_id: body.requestId,
    approve: body.approve,
    note: body.note ?? null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (body.approve && pending) {
    revalidateContent(pending.entity_type, pending.entity_slug);
  }

  return NextResponse.json({ ok: true, request: data });
}
