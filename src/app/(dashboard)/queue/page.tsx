import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserSocialAccounts } from "@/lib/supabase/social-accounts";
import { getUserQueuedPublications, getUserPublicationHistory } from "@/lib/supabase/publications";
import { QueueContent } from "./queue-content";

export default async function QueuePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [accounts, queued, published, failed] = await Promise.all([
    getUserSocialAccounts(user.id),
    getUserQueuedPublications(user.id),
    getUserPublicationHistory(user.id, "published", 20),
    getUserPublicationHistory(user.id, "failed", 20),
  ]);

  return (
    <QueueContent
      connectedAccounts={accounts}
      queued={queued}
      published={published}
      failed={failed}
    />
  );
}
