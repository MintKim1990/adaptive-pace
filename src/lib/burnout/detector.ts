import { createServiceClient } from "@/lib/supabase/service";
import { upsertBurnoutStatusService, setModeService } from "@/lib/supabase/burnout";
import type { BurnoutMode } from "@/types/social";

interface BurnoutCheckResult {
  userId: string;
  previousMode: BurnoutMode;
  newMode: BurnoutMode;
  reason: string;
}

export async function checkBurnout(userId: string): Promise<BurnoutCheckResult> {
  const supabase = createServiceClient();

  // Get current burnout status
  const { data: status } = await supabase
    .from("burnout_status")
    .select("mode")
    .eq("user_id", userId)
    .single();

  const currentMode: BurnoutMode = (status?.mode as BurnoutMode) ?? "active";

  // If user manually paused, skip
  if (currentMode === "paused") {
    return { userId, previousMode: currentMode, newMode: "paused", reason: "Manual pause active" };
  }

  const now = new Date();

  // Count posts in last 14 days
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { count: postsLast14d } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "published")
    .gte("created_at", fourteenDaysAgo);

  // Average posts per 30 days (look at last 60 days, divide by 2)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count: postsLast30to60d } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "published")
    .gte("created_at", sixtyDaysAgo)
    .lt("created_at", thirtyDaysAgo);

  const avgPosts30d = postsLast30to60d ?? 0;
  const recentPosts = postsLast14d ?? 0;

  // Check queue: any scheduled publications?
  const { count: queuedCount } = await supabase
    .from("publications")
    .select("*, posts!inner(*)", { count: "exact", head: true })
    .eq("posts.user_id", userId)
    .eq("status", "scheduled");

  // Last published post date
  const { data: lastPost } = await supabase
    .from("posts")
    .select("created_at")
    .eq("user_id", userId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const daysSinceLastPost = lastPost
    ? (now.getTime() - new Date(lastPost.created_at).getTime()) / (24 * 60 * 60 * 1000)
    : 999;

  // Update stats
  await upsertBurnoutStatusService(userId, {
    posts_in_last_14d: recentPosts,
    avg_posts_30d: avgPosts30d,
    last_active_post_at: lastPost?.created_at ?? null,
  });

  // Burnout detection rule
  const queueEmpty7Days = (queuedCount ?? 0) === 0 && daysSinceLastPost >= 7;
  const frequencyDropped = avgPosts30d > 0 && recentPosts < avgPosts30d * 0.3;
  const shouldEnterSurvival = queueEmpty7Days && frequencyDropped;

  if (currentMode === "active" && shouldEnterSurvival) {
    await setModeService(userId, "survival");
    return {
      userId,
      previousMode: "active",
      newMode: "survival",
      reason: `Queue empty ${Math.floor(daysSinceLastPost)}d, posts dropped to ${recentPosts} (avg: ${avgPosts30d})`,
    };
  }

  return { userId, previousMode: currentMode, newMode: currentMode, reason: "No change" };
}
