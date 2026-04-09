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

  const socialAccounts = await getUserSocialAccounts(user.id);

  const { data: survivalSettings } = await supabase
    .from("burnout_status")
    .select("survival_enabled, survival_rewrite_mode, survival_frequency, survival_consent_at")
    .eq("user_id", user.id)
    .single();

  return (
    <SettingsContent
      socialAccounts={socialAccounts}
      survivalSettings={survivalSettings}
    />
  );
}
