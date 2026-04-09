import type { LinkedInTokenResponse, LinkedInProfile, PlatformEngagement } from "@/types/social";

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo";

const SCOPES = "openid profile w_member_social";

function getRedirectUri(): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/social/linkedin/callback`;
}

export function getLinkedInAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: getRedirectUri(),
    scope: SCOPES,
    state,
  });
  return `${LINKEDIN_AUTH_URL}?${params}`;
}

export async function exchangeLinkedInCode(code: string): Promise<LinkedInTokenResponse> {
  const res = await fetch(LINKEDIN_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getRedirectUri(),
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LinkedIn token exchange failed: ${err}`);
  }

  return res.json();
}

export async function getLinkedInProfile(accessToken: string): Promise<LinkedInProfile> {
  const res = await fetch(LINKEDIN_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error(`Failed to fetch LinkedIn profile (${res.status})`);
  return res.json();
}

export async function publishToLinkedIn(
  accessToken: string,
  personUrn: string,
  text: string
): Promise<{ id: string }> {
  const res = await fetch("https://api.linkedin.com/v2/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      "LinkedIn-Version": "202401",
    },
    body: JSON.stringify({
      author: personUrn,
      commentary: text,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LinkedIn post failed (${res.status}): ${err}`);
  }

  const postId = res.headers.get("x-restli-id") || "";
  return { id: postId };
}

export async function fetchLinkedInEngagement(
  accessToken: string,
  postUrn: string
): Promise<PlatformEngagement> {
  const res = await fetch(
    `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(postUrn)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    }
  );

  if (!res.ok) throw new Error(`LinkedIn engagement fetch failed (${res.status})`);

  const data = await res.json();

  return {
    likes: data.likesSummary?.totalLikes ?? 0,
    comments: data.commentsSummary?.totalFirstLevelComments ?? 0,
    reposts: data.sharesSummary?.totalShares ?? 0,
  };
}

export async function fetchLinkedInPosts(
  accessToken: string,
  personUrn: string,
  count = 50
): Promise<{ id: string; text: string; createdAt: string }[]> {
  const res = await fetch(
    `https://api.linkedin.com/v2/posts?author=${encodeURIComponent(personUrn)}&q=author&count=${count}&sortBy=LAST_MODIFIED`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": "202401",
      },
    }
  );

  if (!res.ok) throw new Error(`LinkedIn posts fetch failed (${res.status})`);

  const data = await res.json();
  return (data.elements ?? []).map((post: { id: string; commentary?: string; createdAt?: number }) => ({
    id: post.id,
    text: post.commentary ?? "",
    createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString(),
  }));
}
