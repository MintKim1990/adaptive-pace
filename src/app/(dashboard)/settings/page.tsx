import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserSocialAccounts } from "@/lib/supabase/social-accounts";
import { SettingsContent } from "./settings-content";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const socialAccounts = await getUserSocialAccounts(user.id);

  return (
    <SettingsContent
      user={user}
      profile={profile}
      socialAccounts={socialAccounts}
    />
  );
}
