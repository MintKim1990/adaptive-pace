import { createClient } from "./server";
import { encrypt, decrypt } from "@/lib/encryption";
import type { SocialAccountPublic, SocialAccountUpsert, SocialPlatform } from "@/types/social";

export async function getUserSocialAccounts(userId: string): Promise<SocialAccountPublic[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("social_accounts")
    .select("id, user_id, platform, platform_user_id, platform_username, display_name, avatar_url, token_expires_at, is_active, created_at, updated_at")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) throw error;
  return (data ?? []) as SocialAccountPublic[];
}

export async function getSocialAccountWithTokens(userId: string, platform: SocialPlatform) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("social_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("platform", platform)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;

  return {
    ...data,
    access_token: decrypt(data.access_token),
    refresh_token: data.refresh_token ? decrypt(data.refresh_token) : null,
  };
}

export async function upsertSocialAccount(data: SocialAccountUpsert): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("social_accounts")
    .upsert(
      {
        ...data,
        access_token: encrypt(data.access_token),
        refresh_token: data.refresh_token ? encrypt(data.refresh_token) : null,
      },
      { onConflict: "user_id,platform" }
    );

  if (error) throw error;
}

export async function disconnectSocialAccount(userId: string, platform: SocialPlatform): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("social_accounts")
    .update({
      is_active: false,
      access_token: "",
      refresh_token: null,
    })
    .eq("user_id", userId)
    .eq("platform", platform);

  if (error) throw error;
}

export async function updateSocialAccountTokens(
  userId: string,
  platform: SocialPlatform,
  accessToken: string,
  refreshToken: string | null,
  expiresAt: string | null
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("social_accounts")
    .update({
      access_token: encrypt(accessToken),
      refresh_token: refreshToken ? encrypt(refreshToken) : null,
      token_expires_at: expiresAt,
    })
    .eq("user_id", userId)
    .eq("platform", platform);

  if (error) throw error;
}

export async function countActiveSocialAccounts(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("social_accounts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) throw error;
  return count ?? 0;
}
