"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SocialAccountCard } from "@/components/social/social-account-card";
import { BlueskyConnectDialog } from "@/components/social/bluesky-connect-dialog";
import { toast } from "sonner";
import type { SocialAccountPublic, SocialPlatform } from "@/types/social";

const PLATFORMS: SocialPlatform[] = ["bluesky", "linkedin", "threads"];

interface SurvivalSettings {
  survival_enabled: boolean;
  survival_rewrite_mode: string;
  survival_frequency: number;
  survival_consent_at: string | null;
}

export function SettingsContent({
  socialAccounts: initialAccounts,
  survivalSettings: initialSurvival,
}: {
  socialAccounts: SocialAccountPublic[];
  survivalSettings: SurvivalSettings | null;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [blueskyDialogOpen, setBlueskyDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [savingSurvival, setSavingSurvival] = useState(false);

  const [survivalEnabled, setSurvivalEnabled] = useState(initialSurvival?.survival_enabled ?? true);
  const [rewriteMode, setRewriteMode] = useState(initialSurvival?.survival_rewrite_mode ?? "original");
  const [frequency, setFrequency] = useState(initialSurvival?.survival_frequency ?? 3);
  const [consentGiven, setConsentGiven] = useState(!!initialSurvival?.survival_consent_at);

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
      window.location.href = `/api/social/${platform}/connect`;
    }
  }

  function handleRefresh() {
    router.refresh();
  }

  async function handleImport() {
    setImporting(true);
    try {
      const res = await fetch("/api/social/import", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Imported ${data.imported} posts from your social accounts.`);
        router.refresh();
      } else {
        toast.error(data.error || "Import failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setImporting(false);
    }
  }

  async function handleSaveSurvival() {
    if (survivalEnabled && !consentGiven) {
      toast.error("Please agree to the auto-publish consent to enable Survival Mode.");
      return;
    }

    setSavingSurvival(true);
    try {
      const res = await fetch("/api/settings/survival", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          survival_enabled: survivalEnabled,
          survival_rewrite_mode: rewriteMode,
          survival_frequency: frequency,
          consent: consentGiven,
        }),
      });
      if (res.ok) {
        toast.success("Survival Mode settings saved.");
        router.refresh();
      } else {
        toast.error("Failed to save settings");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSavingSurvival(false);
    }
  }

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Settings</h2>
        <p className="mt-1 text-muted-foreground">
          Manage your social accounts and preferences.
        </p>
      </div>

      {/* Connected Accounts */}
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

      {/* Import Past Posts */}
      <section className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Import Past Posts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Import your existing posts from connected platforms. This helps the system identify your best-performing content for Survival Mode.
            </p>
            <Button variant="outline" onClick={handleImport} disabled={importing || initialAccounts.length === 0}>
              {importing ? "Importing..." : "Import Posts"}
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Survival Mode Settings */}
      <section className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Survival Mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              When burnout is detected, Survival Mode automatically maintains your social presence by republishing your best-performing content.
            </p>

            <div className="flex items-center justify-between">
              <Label>Enable Survival Mode</Label>
              <button
                type="button"
                role="switch"
                aria-checked={survivalEnabled}
                onClick={() => setSurvivalEnabled(!survivalEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  survivalEnabled ? "bg-primary" : "bg-input"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    survivalEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {survivalEnabled && (
              <>
                <div>
                  <Label className="mb-2 block">Republish Mode</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="rewriteMode"
                        value="original"
                        checked={rewriteMode === "original"}
                        onChange={() => setRewriteMode("original")}
                      />
                      Original (exact republish)
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="rewriteMode"
                        value="rewrite"
                        checked={rewriteMode === "rewrite"}
                        onChange={() => setRewriteMode("rewrite")}
                      />
                      AI Rewrite (better reach, adds #AI-Assisted label)
                    </label>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Frequency</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="radio" name="freq" value="2" checked={frequency === 2} onChange={() => setFrequency(2)} />
                      2x / week
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="radio" name="freq" value="3" checked={frequency === 3} onChange={() => setFrequency(3)} />
                      3x / week
                    </label>
                  </div>
                </div>

                <div className="rounded-lg border p-3 bg-muted/50">
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={consentGiven}
                      onChange={(e) => setConsentGiven(e.target.checked)}
                    />
                    <span>
                      I agree that Adaptive Pace may auto-publish content on my behalf during Survival Mode.
                      Posts will be scheduled 24 hours in advance and can be cancelled from the dashboard.
                      See our <a href="/terms" className="underline text-primary">Terms of Service</a>.
                    </span>
                  </label>
                  {initialSurvival?.survival_consent_at && (
                    <p className="mt-1 ml-6 text-xs text-muted-foreground">
                      Agreed on {new Date(initialSurvival.survival_consent_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </>
            )}

            <Button onClick={handleSaveSurvival} disabled={savingSurvival}>
              {savingSurvival ? "Saving..." : "Save Settings"}
            </Button>
          </CardContent>
        </Card>
      </section>

      <BlueskyConnectDialog
        open={blueskyDialogOpen}
        onOpenChange={setBlueskyDialogOpen}
        onConnected={handleRefresh}
      />
    </>
  );
}
