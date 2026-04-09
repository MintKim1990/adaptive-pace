import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSocialAccountWithTokens } from "@/lib/supabase/social-accounts";
import { refreshBlueskySession } from "@/lib/social/bluesky";
import { fetchBlueskyAuthorFeed } from "@/lib/social/bluesky";
import { fetchLinkedInPosts } from "@/lib/social/linkedin";
import { fetchThreadsPosts } from "@/lib/social/threads";
import { createServiceClient } from "@/lib/supabase/service";
import { calculateEngagementScore } from "@/lib/supabase/analytics";
import { decrypt, encrypt } from "@/lib/encryption";
import type { SocialPlatform } from "@/types/social";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceClient();
  let totalImported = 0;

  // Get all connected accounts
  const { data: accounts } = await serviceClient
    .from("social_accounts")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (!accounts?.length) {
    return NextResponse.json({ error: "No connected accounts" }, { status: 400 });
  }

  for (const account of accounts) {
    try {
      const platform = account.platform as SocialPlatform;
      let accessToken = decrypt(account.access_token);

      // Refresh Bluesky tokens
      if (platform === "bluesky" && account.refresh_token) {
        const refreshJwt = decrypt(account.refresh_token);
        const refreshed = await refreshBlueskySession(refreshJwt);
        accessToken = refreshed.accessJwt;
        await serviceClient
          .from("social_accounts")
          .update({
            access_token: encrypt(refreshed.accessJwt),
            refresh_token: encrypt(refreshed.refreshJwt),
          })
          .eq("id", account.id);
      }

      let posts: { id: string; text: string; createdAt: string; likes?: number; comments?: number; reposts?: number }[] = [];

      switch (platform) {
        case "bluesky": {
          const feed = await fetchBlueskyAuthorFeed(accessToken, account.platform_user_id!, 50);
          posts = feed.map((p) => ({ id: p.uri, text: p.text, createdAt: p.createdAt, likes: p.likes, comments: p.comments, reposts: p.reposts }));
          break;
        }
        case "linkedin": {
          const feed = await fetchLinkedInPosts(accessToken, `urn:li:person:${account.platform_user_id}`, 50);
          posts = feed.map((p) => ({ id: p.id, text: p.text, createdAt: p.createdAt }));
          break;
        }
        case "threads": {
          const feed = await fetchThreadsPosts(accessToken, account.platform_user_id!, 50);
          posts = feed.map((p) => ({ id: p.id, text: p.text, createdAt: p.createdAt }));
          break;
        }
      }

      for (const post of posts) {
        if (!post.text?.trim()) continue;

        // Check if already imported (by platform_post_id)
        const { data: existing } = await serviceClient
          .from("publications")
          .select("id")
          .eq("platform_post_id", post.id)
          .eq("social_account_id", account.id)
          .limit(1);

        if (existing?.length) continue;

        // Create post
        const score = calculateEngagementScore({
          likes: post.likes ?? 0,
          comments: post.comments ?? 0,
          reposts: post.reposts ?? 0,
        });

        const { data: newPost } = await serviceClient
          .from("posts")
          .insert({
            user_id: user.id,
            content: post.text,
            status: "published",
            engagement_score: score,
            created_at: post.createdAt,
          })
          .select()
          .single();

        if (!newPost) continue;

        // Create publication
        const { data: newPub } = await serviceClient
          .from("publications")
          .insert({
            post_id: newPost.id,
            social_account_id: account.id,
            platform,
            platform_post_id: post.id,
            published_at: post.createdAt,
            status: "published",
          })
          .select()
          .single();

        // Create analytics if engagement data available
        if (newPub && (post.likes || post.comments || post.reposts)) {
          await serviceClient.from("analytics").insert({
            publication_id: newPub.id,
            likes: post.likes ?? 0,
            comments: post.comments ?? 0,
            reposts: post.reposts ?? 0,
          });
        }

        totalImported++;
      }
    } catch {
      // Continue with next account on error
    }
  }

  // Mark evergreen posts
  if (totalImported > 0) {
    const { markEvergreenPosts } = await import("@/lib/supabase/analytics");
    await markEvergreenPosts(user.id);
  }

  return NextResponse.json({ imported: totalImported });
}
