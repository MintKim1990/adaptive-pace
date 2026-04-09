import { decrypt, encrypt } from "@/lib/encryption";
import { createServiceClient } from "@/lib/supabase/service";
import { updatePublicationStatusService, updatePostStatusService } from "@/lib/supabase/publications";
import { publishToBluesky } from "./bluesky";
import { refreshBlueskySession } from "./bluesky";
import { publishToLinkedIn } from "./linkedin";
import { publishToThreads } from "./threads";
import type { SocialPlatform } from "@/types/social";

interface PublicationRecord {
  id: string;
  post_id: string;
  platform: SocialPlatform;
  posts: { content: string; user_id: string };
  social_accounts: {
    id: string;
    platform_user_id: string;
    access_token: string;
    refresh_token: string | null;
    token_expires_at: string | null;
  };
}

async function refreshAndSaveTokens(account: PublicationRecord["social_accounts"], platform: SocialPlatform) {
  if (platform === "bluesky" && account.refresh_token) {
    const refreshJwt = decrypt(account.refresh_token);
    const refreshed = await refreshBlueskySession(refreshJwt);

    const supabase = createServiceClient();
    await supabase
      .from("social_accounts")
      .update({
        access_token: encrypt(refreshed.accessJwt),
        refresh_token: encrypt(refreshed.refreshJwt),
      })
      .eq("id", account.id);

    return refreshed.accessJwt;
  }

  // LinkedIn & Threads: tokens last 60 days, just decrypt and use
  return decrypt(account.access_token);
}

export async function publishSinglePublication(pub: PublicationRecord): Promise<void> {
  const { id, platform, posts, social_accounts } = pub;

  try {
    await updatePublicationStatusService(id, "publishing");

    const accessToken = await refreshAndSaveTokens(social_accounts, platform);
    const platformUserId = social_accounts.platform_user_id!;
    let platformPostId = "";

    switch (platform) {
      case "bluesky": {
        const result = await publishToBluesky(accessToken, platformUserId, posts.content);
        platformPostId = result.uri;
        break;
      }
      case "linkedin": {
        const result = await publishToLinkedIn(accessToken, `urn:li:person:${platformUserId}`, posts.content);
        platformPostId = result.id;
        break;
      }
      case "threads": {
        const result = await publishToThreads(accessToken, platformUserId, posts.content);
        platformPostId = result.id;
        break;
      }
    }

    await updatePublicationStatusService(id, "published", platformPostId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await updatePublicationStatusService(id, "failed", undefined, message);
  }
}

export async function resolvePostStatus(postId: string): Promise<void> {
  const supabase = createServiceClient();
  const { data: pubs } = await supabase
    .from("publications")
    .select("status")
    .eq("post_id", postId);

  if (!pubs || pubs.length === 0) return;

  const allPublished = pubs.every((p) => p.status === "published");
  const allFailed = pubs.every((p) => p.status === "failed");
  const allDone = pubs.every((p) => p.status === "published" || p.status === "failed");

  if (!allDone) return;

  if (allFailed) {
    await updatePostStatusService(postId, "failed");
  } else {
    await updatePostStatusService(postId, "published");
  }
}
