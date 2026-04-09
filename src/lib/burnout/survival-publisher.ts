import { createServiceClient } from "@/lib/supabase/service";
import { getStyleProfile } from "@/lib/supabase/style-profiles";
import { rewritePost, addAiLabel } from "@/lib/llm/rewriter";
import type { SocialPlatform } from "@/types/social";

interface SurvivalSettings {
  survival_enabled: boolean;
  survival_rewrite_mode: string;
  survival_frequency: number;
  survival_consent_at: string | null;
}

export async function publishSurvivalContent(
  userId: string,
  settings: SurvivalSettings
): Promise<{ scheduled: boolean; postId?: string }> {
  // Check if enabled + consent given
  if (!settings.survival_enabled || !settings.survival_consent_at) {
    return { scheduled: false };
  }

  const supabase = createServiceClient();

  // Frequency check: map frequency to allowed days
  const dayOfWeek = new Date().getDay();
  const freq2Days = [1, 4]; // Mon, Thu
  const freq3Days = [1, 3, 5]; // Mon, Wed, Fri
  const allowedDays = settings.survival_frequency === 2 ? freq2Days : freq3Days;

  if (!allowedDays.includes(dayOfWeek)) {
    return { scheduled: false };
  }

  // Check if already scheduled/published today in survival mode
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count: todayPubs } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "recycled")
    .gte("created_at", todayStart.toISOString());

  if ((todayPubs ?? 0) > 0) {
    return { scheduled: false };
  }

  // Find an evergreen post not recycled in last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: recentRecycled } = await supabase
    .from("posts")
    .select("original_post_id")
    .eq("user_id", userId)
    .eq("status", "recycled")
    .gte("created_at", thirtyDaysAgo)
    .not("original_post_id", "is", null);

  const excludeIds = (recentRecycled ?? []).map((r) => r.original_post_id).filter(Boolean);

  let query = supabase
    .from("posts")
    .select("id, content")
    .eq("user_id", userId)
    .eq("is_evergreen", true)
    .eq("status", "published")
    .order("engagement_score", { ascending: false })
    .limit(1);

  if (excludeIds.length > 0) {
    query = query.not("id", "in", `(${excludeIds.join(",")})`);
  }

  const { data: candidates } = await query;

  if (!candidates?.length) {
    return { scheduled: false };
  }

  const original = candidates[0];

  // Get all active social accounts
  const { data: accounts } = await supabase
    .from("social_accounts")
    .select("id, platform")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (!accounts?.length) {
    return { scheduled: false };
  }

  // Prepare content based on rewrite mode
  let content = original.content;

  if (settings.survival_rewrite_mode === "rewrite") {
    try {
      const styleProfile = await getStyleProfile(userId);
      // Rewrite for the first platform, use same for all (MVP simplicity)
      const firstPlatform = accounts[0].platform as SocialPlatform;
      content = await rewritePost(original.content, firstPlatform, styleProfile);
      content = addAiLabel(content);
    } catch {
      // Fallback to original if rewrite fails
      content = original.content;
    }
  }

  // Schedule for tomorrow 9 AM (24 hours ahead, allows cancellation)
  const scheduledAt = new Date();
  scheduledAt.setDate(scheduledAt.getDate() + 1);
  scheduledAt.setHours(9, 0, 0, 0);

  // Create post as queued (not immediately published)
  const { data: newPost } = await supabase
    .from("posts")
    .insert({
      user_id: userId,
      content,
      status: "queued",
      original_post_id: original.id,
    })
    .select()
    .single();

  if (!newPost) {
    return { scheduled: false };
  }

  // Create publications scheduled for tomorrow
  const pubInserts = accounts.map((a) => ({
    post_id: newPost.id,
    social_account_id: a.id,
    platform: a.platform,
    scheduled_at: scheduledAt.toISOString(),
    status: "scheduled",
  }));

  await supabase.from("publications").insert(pubInserts);

  return { scheduled: true, postId: newPost.id };
}
