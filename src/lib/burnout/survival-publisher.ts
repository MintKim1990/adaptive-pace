import { createServiceClient } from "@/lib/supabase/service";
import { publishSinglePublication, resolvePostStatus } from "@/lib/social/publisher";

export async function publishSurvivalContent(userId: string): Promise<{ published: boolean; postId?: string }> {
  const supabase = createServiceClient();

  // Check if we should publish today (target: 2-3 times per week)
  // Simple logic: publish on Mon, Wed, Fri
  const dayOfWeek = new Date().getDay();
  const publishDays = [1, 3, 5]; // Mon, Wed, Fri
  if (!publishDays.includes(dayOfWeek)) {
    return { published: false };
  }

  // Check if already published today in survival mode
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count: todayPubs } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "recycled")
    .gte("created_at", todayStart.toISOString());

  if ((todayPubs ?? 0) > 0) {
    return { published: false };
  }

  // Find an evergreen post not recycled in last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Get IDs of recently recycled original posts
  const { data: recentRecycled } = await supabase
    .from("posts")
    .select("original_post_id")
    .eq("user_id", userId)
    .eq("status", "recycled")
    .gte("created_at", thirtyDaysAgo)
    .not("original_post_id", "is", null);

  const excludeIds = (recentRecycled ?? []).map((r) => r.original_post_id).filter(Boolean);

  // Find best evergreen post
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
    return { published: false };
  }

  const original = candidates[0];

  // Create a recycled post
  const { data: newPost, error: postError } = await supabase
    .from("posts")
    .insert({
      user_id: userId,
      content: original.content,
      status: "publishing",
      original_post_id: original.id,
    })
    .select()
    .single();

  if (postError || !newPost) {
    return { published: false };
  }

  // Get all active social accounts
  const { data: accounts } = await supabase
    .from("social_accounts")
    .select("id, platform")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (!accounts?.length) {
    return { published: false };
  }

  // Create publications for all connected platforms
  const pubInserts = accounts.map((a) => ({
    post_id: newPost.id,
    social_account_id: a.id,
    platform: a.platform,
    status: "publishing",
  }));

  const { data: pubs } = await supabase
    .from("publications")
    .insert(pubInserts)
    .select("*, posts(*), social_accounts(*)");

  if (pubs) {
    for (const pub of pubs) {
      await publishSinglePublication(pub);
    }
    await resolvePostStatus(newPost.id);
  }

  // Mark as recycled
  await supabase
    .from("posts")
    .update({ status: "recycled" })
    .eq("id", newPost.id);

  return { published: true, postId: newPost.id };
}
