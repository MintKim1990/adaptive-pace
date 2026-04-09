import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  exchangeThreadsCode,
  exchangeForLongLivedToken,
  getThreadsProfile,
} from "@/lib/social/threads";
import { upsertSocialAccount } from "@/lib/supabase/social-accounts";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const settingsUrl = new URL("/settings", process.env.NEXT_PUBLIC_APP_URL!);

  if (error || !code) {
    settingsUrl.searchParams.set("error", "threads_denied");
    return NextResponse.redirect(settingsUrl);
  }

  // CSRF validation
  const cookieStore = await cookies();
  const savedState = cookieStore.get("threads_oauth_state")?.value;
  cookieStore.delete("threads_oauth_state");

  if (!savedState || savedState !== state) {
    settingsUrl.searchParams.set("error", "threads_state_mismatch");
    return NextResponse.redirect(settingsUrl);
  }

  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL!));
  }

  try {
    // Step 1: Exchange code for short-lived token
    const shortLived = await exchangeThreadsCode(code);

    // Step 2: Exchange for long-lived token (60 days)
    const longLived = await exchangeForLongLivedToken(shortLived.access_token);

    // Step 3: Fetch profile
    const profile = await getThreadsProfile(longLived.access_token);

    const expiresAt = new Date(Date.now() + longLived.expires_in * 1000).toISOString();

    await upsertSocialAccount({
      user_id: user.id,
      platform: "threads",
      platform_user_id: profile.id,
      platform_username: profile.username,
      display_name: profile.name ?? null,
      avatar_url: profile.threads_profile_picture_url ?? null,
      access_token: longLived.access_token,
      refresh_token: null, // Threads uses token refresh on the long-lived token itself
      token_expires_at: expiresAt,
      is_active: true,
    });

    settingsUrl.searchParams.set("connected", "threads");
    return NextResponse.redirect(settingsUrl);
  } catch {
    settingsUrl.searchParams.set("error", "threads_failed");
    return NextResponse.redirect(settingsUrl);
  }
}
