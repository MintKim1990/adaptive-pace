import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getPostsWithAnalytics } from "@/lib/supabase/analytics";
import { AnalyticsContent } from "./analytics-content";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const posts = await getPostsWithAnalytics(user.id);

  return <AnalyticsContent posts={posts} />;
}
