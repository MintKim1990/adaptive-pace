import { createServiceClient } from "./service";
import type { AnalyticsRecord, PlatformEngagement } from "@/types/social";

export function calculateEngagementScore(engagement: PlatformEngagement): number {
  return engagement.likes * 1 + engagement.comments * 3 + engagement.reposts * 5;
}

export async function upsertAnalytics(
  publicationId: string,
  engagement: PlatformEngagement
): Promise<void> {
  const supabase = createServiceClient();

  // Check if record exists
  const { data: existing } = await supabase
    .from("analytics")
    .select("id")
    .eq("publication_id", publicationId)
    .single();

  if (existing) {
    await supabase
      .from("analytics")
      .update({
        likes: engagement.likes,
        comments: engagement.comments,
        reposts: engagement.reposts,
        impressions: engagement.impressions ?? 0,
        fetched_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("analytics").insert({
      publication_id: publicationId,
      likes: engagement.likes,
      comments: engagement.comments,
      reposts: engagement.reposts,
      impressions: engagement.impressions ?? 0,
    });
  }
}

export async function updatePostEngagementScore(postId: string): Promise<void> {
  const supabase = createServiceClient();

  // Get all analytics for this post's publications
  const { data: pubs } = await supabase
    .from("publications")
    .select("id")
    .eq("post_id", postId)
    .eq("status", "published");

  if (!pubs?.length) return;

  const pubIds = pubs.map((p) => p.id);
  const { data: analytics } = await supabase
    .from("analytics")
    .select("likes, comments, reposts")
    .in("publication_id", pubIds);

  if (!analytics?.length) return;

  // Sum across all publications
  const total = analytics.reduce(
    (acc, a) => ({
      likes: acc.likes + a.likes,
      comments: acc.comments + a.comments,
      reposts: acc.reposts + a.reposts,
    }),
    { likes: 0, comments: 0, reposts: 0 }
  );

  const score = calculateEngagementScore(total);

  await supabase
    .from("posts")
    .update({ engagement_score: score })
    .eq("id", postId);
}

export async function markEvergreenPosts(userId: string): Promise<void> {
  const supabase = createServiceClient();

  // Reset existing evergreen flags
  await supabase
    .from("posts")
    .update({ is_evergreen: false })
    .eq("user_id", userId)
    .eq("is_evergreen", true);

  // Get published posts from last 30 days with scores
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: posts } = await supabase
    .from("posts")
    .select("id, engagement_score")
    .eq("user_id", userId)
    .eq("status", "published")
    .gte("created_at", thirtyDaysAgo)
    .gt("engagement_score", 0)
    .order("engagement_score", { ascending: false });

  if (!posts?.length) return;

  // Top 10%
  const top10Count = Math.max(1, Math.ceil(posts.length * 0.1));
  const topIds = posts.slice(0, top10Count).map((p) => p.id);

  await supabase
    .from("posts")
    .update({ is_evergreen: true })
    .in("id", topIds);
}

// For analytics page
export async function getPostsWithAnalytics(userId: string) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("posts")
    .select("id, content, status, engagement_score, is_evergreen, created_at, publications(id, platform, platform_post_id, published_at, analytics(likes, comments, reposts, impressions, fetched_at))")
    .eq("user_id", userId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}
