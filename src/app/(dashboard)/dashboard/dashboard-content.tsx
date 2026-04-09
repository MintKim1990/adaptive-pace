"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BurnoutMode } from "@/types/social";

const modeConfig: Record<BurnoutMode, { label: string; color: string; description: string }> = {
  active: { label: "Active", color: "bg-green-500", description: "You're actively posting. Keep it up!" },
  survival: { label: "Survival", color: "bg-amber-500", description: "System is maintaining your accounts while you rest." },
  paused: { label: "Paused", color: "bg-gray-500", description: "Posting is manually paused." },
};

export function DashboardContent({
  profileName,
  accountCount,
  burnoutMode,
}: {
  profileName: string | null;
  accountCount: number;
  burnoutMode: BurnoutMode;
}) {
  const mode = modeConfig[burnoutMode];

  return (
    <>
      {burnoutMode === "survival" && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Your accounts are safe. The system is automatically publishing your best content while you rest.
          </p>
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
            Create a new post from the <Link href="/queue" className="underline">Queue</Link> to return to Active mode.
          </p>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-3xl font-bold">Welcome back{profileName ? `, ${profileName}` : ""}!</h2>
        <p className="mt-1 text-muted-foreground">
          Your social accounts are safe. Here&apos;s your overview.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={`${mode.color} text-white`}>{mode.label}</Badge>
            <p className="mt-2 text-xs text-muted-foreground">{mode.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Connected Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{accountCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Posts This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Get Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground">
            Connect your social accounts to start scheduling content.
          </p>
          <Link
            href="/settings"
            className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80"
          >
            Connect Social Account
          </Link>
        </CardContent>
      </Card>
    </>
  );
}
