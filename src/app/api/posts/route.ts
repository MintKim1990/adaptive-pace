import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPost, getUserPosts } from "@/lib/supabase/posts";
import { createPublications } from "@/lib/supabase/publications";
import { getUserSocialAccounts } from "@/lib/supabase/social-accounts";
import { publishSinglePublication, resolvePostStatus } from "@/lib/social/publisher";
import { getScheduledPublicationsForCron } from "@/lib/supabase/publications";
import type { CreatePostRequest, PostStatus, SocialPlatform, PLATFORM_CHAR_LIMITS } from "@/types/social";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreatePostRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { content, platforms, scheduled_at } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }
  if (!platforms?.length) {
    return NextResponse.json({ error: "At least one platform is required" }, { status: 400 });
  }

  // Verify user has connected accounts for selected platforms
  const accounts = await getUserSocialAccounts(user.id);
  const entries: { post_id: string; social_account_id: string; platform: SocialPlatform; scheduled_at: string | null }[] = [];

  for (const platform of platforms) {
    const account = accounts.find((a) => a.platform === platform);
    if (!account) {
      return NextResponse.json({ error: `${platform} is not connected` }, { status: 400 });
    }
  }

  try {
    const post = await createPost(user.id, content.trim());

    for (const platform of platforms) {
      const account = accounts.find((a) => a.platform === platform)!;
      entries.push({
        post_id: post.id,
        social_account_id: account.id,
        platform,
        scheduled_at: scheduled_at || null,
      });
    }

    const publications = await createPublications(entries);

    // If no scheduled time, publish immediately
    if (!scheduled_at) {
      // Fetch full publication records with joins for the publisher
      const supabaseService = (await import("@/lib/supabase/service")).createServiceClient();
      const { data: fullPubs } = await supabaseService
        .from("publications")
        .select("*, posts(*), social_accounts(*)")
        .eq("post_id", post.id);

      if (fullPubs) {
        for (const pub of fullPubs) {
          await publishSinglePublication(pub);
        }
        await resolvePostStatus(post.id);
      }
    }

    return NextResponse.json({ post, publications }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create post";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as PostStatus | null;

  try {
    const posts = await getUserPosts(user.id, status ?? undefined);
    return NextResponse.json(posts);
  } catch {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
