import { createClient } from "./server";
import { createServiceClient } from "./service";
import type { Publication, PublicationStatus, PublicationWithPost, SocialPlatform } from "@/types/social";

export async function createPublications(
  entries: { post_id: string; social_account_id: string; platform: SocialPlatform; scheduled_at: string | null }[]
): Promise<Publication[]> {
  const supabase = await createClient();
  const rows = entries.map((e) => ({
    ...e,
    status: e.scheduled_at ? "scheduled" : "publishing",
  }));

  const { data, error } = await supabase
    .from("publications")
    .insert(rows)
    .select();

  if (error) throw error;
  return (data ?? []) as Publication[];
}

export async function getPublicationsByPostId(postId: string): Promise<Publication[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("publications")
    .select("*")
    .eq("post_id", postId);

  if (error) throw error;
  return (data ?? []) as Publication[];
}

export async function getUserQueuedPublications(userId: string): Promise<PublicationWithPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("publications")
    .select("*, posts!inner(*)")
    .eq("posts.user_id", userId)
    .eq("status", "scheduled")
    .order("scheduled_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as PublicationWithPost[];
}

export async function getUserPublicationHistory(
  userId: string,
  status: PublicationStatus,
  limit = 20
): Promise<PublicationWithPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("publications")
    .select("*, posts!inner(*)")
    .eq("posts.user_id", userId)
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as PublicationWithPost[];
}

export async function updatePublicationStatus(
  publicationId: string,
  status: PublicationStatus,
  platformPostId?: string,
  errorMessage?: string
): Promise<void> {
  const supabase = await createClient();
  const update: Record<string, unknown> = { status };
  if (platformPostId) update.platform_post_id = platformPostId;
  if (errorMessage) update.error_message = errorMessage;
  if (status === "published") update.published_at = new Date().toISOString();

  const { error } = await supabase
    .from("publications")
    .update(update)
    .eq("id", publicationId);

  if (error) throw error;
}

// For cron job — uses service role to bypass RLS
export async function getScheduledPublicationsForCron(limit = 10) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("publications")
    .select("*, posts(*), social_accounts(*)")
    .eq("status", "scheduled")
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

// For cron job — update via service role
export async function updatePublicationStatusService(
  publicationId: string,
  status: PublicationStatus,
  platformPostId?: string,
  errorMessage?: string
): Promise<void> {
  const supabase = createServiceClient();
  const update: Record<string, unknown> = { status };
  if (platformPostId) update.platform_post_id = platformPostId;
  if (errorMessage) update.error_message = errorMessage;
  if (status === "published") update.published_at = new Date().toISOString();

  const { error } = await supabase
    .from("publications")
    .update(update)
    .eq("id", publicationId);

  if (error) throw error;
}

export async function updatePostStatusService(postId: string, status: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("posts")
    .update({ status })
    .eq("id", postId);

  if (error) throw error;
}
