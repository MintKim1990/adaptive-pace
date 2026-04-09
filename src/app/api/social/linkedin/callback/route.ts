import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { exchangeLinkedInCode, getLinkedInProfile } from "@/lib/social/linkedin";
import { upsertSocialAccount } from "@/lib/supabase/social-accounts";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const settingsUrl = new URL("/settings", process.env.NEXT_PUBLIC_APP_URL!);

  if (error || !code) {
    settingsUrl.searchParams.set("error", "linkedin_denied");
    return NextResponse.redirect(settingsUrl);
  }

  // CSRF validation
  const cookieStore = await cookies();
  const savedState = cookieStore.get("linkedin_oauth_state")?.value;
  cookieStore.delete("linkedin_oauth_state");

  if (!savedState || savedState !== state) {
    settingsUrl.searchParams.set("error", "linkedin_state_mismatch");
    return NextResponse.redirect(settingsUrl);
  }

  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL!));
  }

  try {
    const tokens = await exchangeLinkedInCode(code);
    const profile = await getLinkedInProfile(tokens.access_token);

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    await upsertSocialAccount({
      user_id: user.id,
      platform: "linkedin",
      platform_user_id: profile.sub,
      platform_username: profile.name,
      display_name: profile.name,
      avatar_url: profile.picture ?? null,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      token_expires_at: expiresAt,
      is_active: true,
    });

    settingsUrl.searchParams.set("connected", "linkedin");
    return NextResponse.redirect(settingsUrl);
  } catch {
    settingsUrl.searchParams.set("error", "linkedin_failed");
    return NextResponse.redirect(settingsUrl);
  }
}
