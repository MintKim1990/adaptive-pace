// ── Platform ──
export type SocialPlatform = "bluesky" | "linkedin" | "threads";

// ── Database row (mirrors social_accounts table) ──
export interface SocialAccount {
  id: string;
  user_id: string;
  platform: SocialPlatform;
  platform_user_id: string | null;
  platform_username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Safe version for client (no tokens) ──
export type SocialAccountPublic = Omit<SocialAccount, "access_token" | "refresh_token">;

// ── Bluesky AT Protocol ──
export interface BlueskySession {
  did: string;
  handle: string;
  email?: string;
  accessJwt: string;
  refreshJwt: string;
}

export interface BlueskyProfile {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
}

// ── LinkedIn OAuth 2.0 ──
export interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope: string;
}

export interface LinkedInProfile {
  sub: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
}

// ── Threads (Meta) OAuth ──
export interface ThreadsShortLivedTokenResponse {
  access_token: string;
  user_id: number;
}

export interface ThreadsLongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface ThreadsProfile {
  id: string;
  username: string;
  name?: string;
  threads_profile_picture_url?: string;
}

// ── API helpers ──
export interface BlueskyConnectRequest {
  handle: string;
  appPassword: string;
}

export interface SocialAccountUpsert {
  user_id: string;
  platform: SocialPlatform;
  platform_user_id: string;
  platform_username: string;
  display_name: string | null;
  avatar_url: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  is_active: boolean;
}
