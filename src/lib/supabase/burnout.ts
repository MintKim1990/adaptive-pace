import { createClient } from "./server";
import { createServiceClient } from "./service";
import type { BurnoutMode, BurnoutStatus } from "@/types/social";

export async function getBurnoutStatus(userId: string): Promise<BurnoutStatus | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("burnout_status")
    .select("*")
    .eq("user_id", userId)
    .single();

  return data as BurnoutStatus | null;
}

export async function upsertBurnoutStatusService(
  userId: string,
  updates: Partial<Pick<BurnoutStatus, "mode" | "last_active_post_at" | "survival_entered_at" | "posts_in_last_14d" | "avg_posts_30d">>
): Promise<void> {
  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("burnout_status")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (existing) {
    await supabase
      .from("burnout_status")
      .update(updates)
      .eq("user_id", userId);
  } else {
    await supabase
      .from("burnout_status")
      .insert({ user_id: userId, ...updates });
  }
}

export async function setModeService(userId: string, mode: BurnoutMode): Promise<void> {
  const supabase = createServiceClient();
  const updates: Record<string, unknown> = { mode };

  if (mode === "survival") {
    updates.survival_entered_at = new Date().toISOString();
  }
  if (mode === "active") {
    updates.survival_entered_at = null;
    updates.last_active_post_at = new Date().toISOString();
  }

  const { data: existing } = await supabase
    .from("burnout_status")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (existing) {
    await supabase
      .from("burnout_status")
      .update(updates)
      .eq("user_id", userId);
  } else {
    await supabase
      .from("burnout_status")
      .insert({ user_id: userId, ...updates });
  }
}

// Get all users with active social accounts for cron
export async function getAllActiveUsersService(): Promise<string[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("social_accounts")
    .select("user_id")
    .eq("is_active", true);

  if (!data) return [];
  return [...new Set(data.map((d) => d.user_id))];
}
