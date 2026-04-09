import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createBlueskySession, getBlueskyProfile } from "@/lib/social/bluesky";
import { upsertSocialAccount } from "@/lib/supabase/social-accounts";
import type { BlueskyConnectRequest } from "@/types/social";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: BlueskyConnectRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { handle, appPassword } = body;
  if (!handle || !appPassword) {
    return NextResponse.json({ error: "Handle and app password are required" }, { status: 400 });
  }

  try {
    const session = await createBlueskySession(handle, appPassword);
    const profile = await getBlueskyProfile(session.accessJwt, session.did);

    await upsertSocialAccount({
      user_id: user.id,
      platform: "bluesky",
      platform_user_id: session.did,
      platform_username: session.handle,
      display_name: profile.displayName ?? null,
      avatar_url: profile.avatar ?? null,
      access_token: session.accessJwt,
      refresh_token: session.refreshJwt,
      token_expires_at: null,
      is_active: true,
    });

    return NextResponse.json({
      success: true,
      account: {
        platform: "bluesky",
        platform_username: session.handle,
        display_name: profile.displayName ?? null,
        avatar_url: profile.avatar ?? null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connection failed";
    const status = message.includes("Invalid handle") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
