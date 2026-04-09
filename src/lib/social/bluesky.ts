import type { BlueskySession, BlueskyProfile, PlatformEngagement } from "@/types/social";

const BSKY_API = "https://bsky.social/xrpc";

export async function createBlueskySession(
  identifier: string,
  password: string
): Promise<BlueskySession> {
  const res = await fetch(`${BSKY_API}/com.atproto.server.createSession`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) throw new Error("Invalid handle or app password");
    throw new Error(err.message || `Bluesky auth failed (${res.status})`);
  }

  return res.json();
}

export async function getBlueskyProfile(
  accessJwt: string,
  actor: string
): Promise<BlueskyProfile> {
  const res = await fetch(`${BSKY_API}/app.bsky.actor.getProfile?actor=${encodeURIComponent(actor)}`, {
    headers: { Authorization: `Bearer ${accessJwt}` },
  });

  if (!res.ok) throw new Error(`Failed to fetch Bluesky profile (${res.status})`);
  return res.json();
}

export async function refreshBlueskySession(
  refreshJwt: string
): Promise<{ accessJwt: string; refreshJwt: string }> {
  const res = await fetch(`${BSKY_API}/com.atproto.server.refreshSession`, {
    method: "POST",
    headers: { Authorization: `Bearer ${refreshJwt}` },
  });

  if (!res.ok) throw new Error(`Bluesky token refresh failed (${res.status})`);
  return res.json();
}

export async function publishToBluesky(
  accessJwt: string,
  did: string,
  text: string
): Promise<{ uri: string; cid: string }> {
  const res = await fetch(`${BSKY_API}/com.atproto.repo.createRecord`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessJwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      repo: did,
      collection: "app.bsky.feed.post",
      record: {
        $type: "app.bsky.feed.post",
        text,
        createdAt: new Date().toISOString(),
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Bluesky post failed (${res.status})`);
  }

  return res.json();
}

export async function fetchBlueskyEngagement(
  accessJwt: string,
  uri: string
): Promise<PlatformEngagement> {
  const res = await fetch(
    `${BSKY_API}/app.bsky.feed.getPostThread?uri=${encodeURIComponent(uri)}&depth=0`,
    { headers: { Authorization: `Bearer ${accessJwt}` } }
  );

  if (!res.ok) throw new Error(`Bluesky engagement fetch failed (${res.status})`);

  const data = await res.json();
  const post = data.thread?.post;

  return {
    likes: post?.likeCount ?? 0,
    comments: post?.replyCount ?? 0,
    reposts: post?.repostCount ?? 0,
  };
}

export async function fetchBlueskyAuthorFeed(
  accessJwt: string,
  actor: string,
  limit = 50
): Promise<{ uri: string; text: string; createdAt: string; likes: number; comments: number; reposts: number }[]> {
  const res = await fetch(
    `${BSKY_API}/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(actor)}&limit=${limit}&filter=posts_no_replies`,
    { headers: { Authorization: `Bearer ${accessJwt}` } }
  );

  if (!res.ok) throw new Error(`Bluesky feed fetch failed (${res.status})`);

  const data = await res.json();
  return (data.feed ?? []).map((item: { post: { uri: string; record: { text: string; createdAt: string }; likeCount?: number; replyCount?: number; repostCount?: number } }) => ({
    uri: item.post.uri,
    text: item.post.record?.text ?? "",
    createdAt: item.post.record?.createdAt ?? new Date().toISOString(),
    likes: item.post.likeCount ?? 0,
    comments: item.post.replyCount ?? 0,
    reposts: item.post.repostCount ?? 0,
  }));
}
