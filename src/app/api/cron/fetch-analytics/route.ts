import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { decrypt } from "@/lib/encryption";
import { refreshBlueskySession } from "@/lib/social/bluesky";
import { fetchBlueskyEngagement } from "@/lib/social/bluesky";
import { fetchLinkedInEngagement } from "@/lib/social/linkedin";
import { fetchThreadsEngagement } from "@/lib/social/threads";
import { upsertAnalytics, updatePostEngagementScore, markEvergreenPosts } from "@/lib/supabase/analytics";
import { encrypt } from "@/lib/encryption";
import type { SocialPlatform, PlatformEngagement } from "@/types/social";

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  try {
    // Fetch published publications from last 14 days with platform_post_id
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data: publications } = await supabase
      .from("publications")
      .select("id, post_id, platform, platform_post_id, social_accounts(id, platform_user_id, access_token, refresh_token)")
      .eq("status", "published")
      .not("platform_post_id", "is", null)
      .gte("published_at", fourteenDaysAgo)
      .limit(50);

    if (!publications?.length) {
      return NextResponse.json({ processed: 0 });
    }

    let processed = 0;
    let errors = 0;
    const affectedPostIds = new Set<string>();
    const affectedUserIds = new Set<string>();

    for (const pub of publications) {
      try {
        const account = pub.social_accounts as unknown as {
          id: string;
          platform_user_id: string;
          access_token: string;
          refresh_token: string | null;
        };

        let accessToken: string;
        const platform = pub.platform as SocialPlatform;

        // Get access token (refresh for Bluesky)
        if (platform === "bluesky" && account.refresh_token) {
          const refreshJwt = decrypt(account.refresh_token);
          const refreshed = await refreshBlueskySession(refreshJwt);
          accessToken = refreshed.accessJwt;

          // Save refreshed tokens
          await supabase
            .from("social_accounts")
            .update({
              access_token: encrypt(refreshed.accessJwt),
              refresh_token: encrypt(refreshed.refreshJwt),
            })
            .eq("id", account.id);
        } else {
          accessToken = decrypt(account.access_token);
        }

        // Fetch engagement
        let engagement: PlatformEngagement;

        switch (platform) {
          case "bluesky":
            engagement = await fetchBlueskyEngagement(accessToken, pub.platform_post_id!);
            break;
          case "linkedin":
            engagement = await fetchLinkedInEngagement(accessToken, pub.platform_post_id!);
            break;
          case "threads":
            engagement = await fetchThreadsEngagement(accessToken, pub.platform_post_id!);
            break;
          default:
            continue;
        }

        await upsertAnalytics(pub.id, engagement);
        affectedPostIds.add(pub.post_id);
        processed++;
      } catch {
        errors++;
      }
    }

    // Update engagement scores for affected posts
    for (const postId of affectedPostIds) {
      await updatePostEngagementScore(postId);

      // Get user_id for evergreen tagging
      const { data: post } = await supabase
        .from("posts")
        .select("user_id")
        .eq("id", postId)
        .single();
      if (post) affectedUserIds.add(post.user_id);
    }

    // Mark evergreen for affected users
    for (const userId of affectedUserIds) {
      await markEvergreenPosts(userId);
    }

    return NextResponse.json({ processed, errors });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analytics fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
