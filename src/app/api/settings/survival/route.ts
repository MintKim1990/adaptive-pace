import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { survival_enabled, survival_rewrite_mode, survival_frequency, consent } = body;

  const serviceClient = createServiceClient();

  const updates: Record<string, unknown> = {
    survival_enabled,
    survival_rewrite_mode,
    survival_frequency,
  };

  if (consent) {
    updates.survival_consent_at = new Date().toISOString();
  }

  // Upsert burnout_status with settings
  const { data: existing } = await serviceClient
    .from("burnout_status")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    await serviceClient
      .from("burnout_status")
      .update(updates)
      .eq("user_id", user.id);
  } else {
    await serviceClient
      .from("burnout_status")
      .insert({ user_id: user.id, ...updates });
  }

  return NextResponse.json({ success: true });
}
