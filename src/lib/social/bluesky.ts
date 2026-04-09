import type { BlueskySession, BlueskyProfile } from "@/types/social";

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
