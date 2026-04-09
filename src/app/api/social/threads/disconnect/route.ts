import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { disconnectSocialAccount } from "@/lib/supabase/social-accounts";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await disconnectSocialAccount(user.id, "threads");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }
}
