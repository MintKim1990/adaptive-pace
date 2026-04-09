import { createServiceClient } from "./service";

interface StyleProfile {
  tone_description: string | null;
  avg_sentence_length: number | null;
  emoji_frequency: number | null;
  common_expressions: string[];
  sample_posts: unknown;
}

export async function getStyleProfile(userId: string): Promise<StyleProfile | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("style_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  return data as StyleProfile | null;
}

export async function upsertStyleProfile(
  userId: string,
  profile: {
    tone_description: string;
    avg_sentence_length: number;
    emoji_frequency: number;
    common_expressions: string[];
    sample_posts: string[];
  }
): Promise<void> {
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("style_profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (existing) {
    await supabase
      .from("style_profiles")
      .update({
        ...profile,
        sample_posts: JSON.stringify(profile.sample_posts),
      })
      .eq("user_id", userId);
  } else {
    await supabase
      .from("style_profiles")
      .insert({
        user_id: userId,
        ...profile,
        sample_posts: JSON.stringify(profile.sample_posts),
      });
  }
}
