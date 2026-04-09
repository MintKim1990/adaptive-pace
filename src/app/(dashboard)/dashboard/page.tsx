import { countActiveSocialAccounts } from "@/lib/supabase/social-accounts";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardContent } from "./dashboard-content";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  const accountCount = await countActiveSocialAccounts(user.id);

  return <DashboardContent profileName={profile?.name ?? null} accountCount={accountCount} />;
}
