import type { LinkedInTokenResponse, LinkedInProfile } from "@/types/social";

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
