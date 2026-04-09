import type {
  ThreadsShortLivedTokenResponse,
  ThreadsLongLivedTokenResponse,
  ThreadsProfile,
} from "@/types/social";

const THREADS_AUTH_URL = "https://www.threads.net/oauth/authorize";
const THREADS_SHORT_TOKEN_URL = "https://graph.threads.net/oauth/access_token";
const THREADS_LONG_TOKEN_URL = "https://graph.threads.net/access_token";
const THREADS_API_URL = "https://graph.threads.net/v1.0";

const SCOPES = "threads_basic,threads_content_publish,threads_read_replies";

function getRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL!;
  // Meta requires HTTPS for callback URLs, force https for Threads
  const httpsBase = base.replace(/^http:\/\//, "https://");
  return `${httpsBase}/api/social/threads/callback`;
}

export function getThreadsAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.THREADS_APP_ID!,
    redirect_uri: getRedirectUri(),
    scope: SCOPES,
    response_type: "code",
    state,
  });
  return `${THREADS_AUTH_URL}?${params}`;
}

export async function exchangeThreadsCode(code: string): Promise<ThreadsShortLivedTokenResponse> {
  const res = await fetch(THREADS_SHORT_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.THREADS_APP_ID!,
      client_secret: process.env.THREADS_APP_SECRET!,
      grant_type: "authorization_code",
      redirect_uri: getRedirectUri(),
      code,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Threads token exchange failed: ${err}`);
  }

  return res.json();
}

export async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<ThreadsLongLivedTokenResponse> {
  const params = new URLSearchParams({
    grant_type: "th_exchange_token",
    client_secret: process.env.THREADS_APP_SECRET!,
    access_token: shortLivedToken,
  });

  const res = await fetch(`${THREADS_LONG_TOKEN_URL}?${params}`);

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Threads long-lived token exchange failed: ${err}`);
  }

  return res.json();
}

export async function refreshThreadsToken(
  longLivedToken: string
): Promise<ThreadsLongLivedTokenResponse> {
  const params = new URLSearchParams({
    grant_type: "th_refresh_token",
    access_token: longLivedToken,
  });

  const res = await fetch(`${THREADS_LONG_TOKEN_URL}?${params}`);

  if (!res.ok) throw new Error(`Threads token refresh failed (${res.status})`);
  return res.json();
}

export async function getThreadsProfile(accessToken: string): Promise<ThreadsProfile> {
  const params = new URLSearchParams({
    fields: "id,username,name,threads_profile_picture_url",
    access_token: accessToken,
  });

  const res = await fetch(`${THREADS_API_URL}/me?${params}`);

  if (!res.ok) throw new Error(`Failed to fetch Threads profile (${res.status})`);
  return res.json();
}
