"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SocialAccountCard } from "@/components/social/social-account-card";
import { BlueskyConnectDialog } from "@/components/social/bluesky-connect-dialog";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import type { SocialAccountPublic, SocialPlatform } from "@/types/social";

interface Profile {
  id: string;
  email: string;
  name: string | null;
  plan: string;
}

const PLATFORMS: SocialPlatform[] = ["bluesky", "linkedin", "threads"];

export function SettingsContent({
  user,
  profile,
  socialAccounts: initialAccounts,
}: {
  user: User;
  profile: Profile | null;
  socialAccounts: SocialAccountPublic[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [blueskyDialogOpen, setBlueskyDialogOpen] = useState(false);

  // Show toast for OAuth callback results
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected) {
      toast.success(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully!`);
      router.replace("/settings");
    }
    if (error) {
      const messages: Record<string, string> = {
        linkedin_denied: "LinkedIn connection was denied.",
        linkedin_failed: "LinkedIn connection failed. Please try again.",
        linkedin_state_mismatch: "LinkedIn connection failed (security check). Please try again.",
        threads_denied: "Threads connection was denied.",
        threads_failed: "Threads connection failed. Please try again.",
        threads_state_mismatch: "Threads connection failed (security check). Please try again.",
      };
      toast.error(messages[error] || "Connection failed. Please try again.");
      router.replace("/settings");
    }
  }, [searchParams, router]);

  function getAccount(platform: SocialPlatform): SocialAccountPublic | null {
    return initialAccounts.find((a) => a.platform === platform) ?? null;
  }

  function handleConnect(platform: SocialPlatform) {
    if (platform === "bluesky") {
      setBlueskyDialogOpen(true);
    } else {
      // OAuth redirect flow
      window.location.href = `/api/social/${platform}/connect`;
    }
  }

  function handleRefresh() {
    router.refresh();
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <h1 className="text-xl font-bold">Adaptive Pace</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {profile?.name || user.email}
            </span>
            <Badge variant="secondary">{profile?.plan || "free"}</Badge>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Settings</h2>
          <p className="mt-1 text-muted-foreground">
            Manage your social accounts and preferences.
          </p>
        </div>

        <section>
          <h3 className="mb-4 text-lg font-semibold">Connected Accounts</h3>
          <div className="grid gap-4">
            {PLATFORMS.map((platform) => (
              <SocialAccountCard
                key={platform}
                platform={platform}
                account={getAccount(platform)}
                onConnect={() => handleConnect(platform)}
                onDisconnected={handleRefresh}
              />
            ))}
          </div>
        </section>

        <div className="mt-8">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </main>

      <BlueskyConnectDialog
        open={blueskyDialogOpen}
        onOpenChange={setBlueskyDialogOpen}
        onConnected={handleRefresh}
      />
    </div>
  );
}
