import { createClient } from "./server";
import type { Post, PostStatus } from "@/types/social";

export async function createPost(userId: string, content: string): Promise<Post> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .insert({ user_id: userId, content, status: "queued" })
    .select()
    .single();

  if (error) throw error;
  return data as Post;
}

export async function getUserPosts(userId: string, status?: PostStatus): Promise<Post[]> {
  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Post[];
}

export async function getPostById(postId: string): Promise<Post | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (error) return null;
  return data as Post;
}

export async function updatePost(postId: string, content: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .update({ content })
    .eq("id", postId);

  if (error) throw error;
}

export async function updatePostStatus(postId: string, status: PostStatus): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .update({ status })
    .eq("id", postId);

  if (error) throw error;
}

export async function deletePost(postId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId);

  if (error) throw error;
}
