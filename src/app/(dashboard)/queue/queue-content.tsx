"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ComposeForm } from "@/components/post/compose-form";
import { QueueItem } from "@/components/post/queue-item";
import type { SocialAccountPublic, PublicationWithPost } from "@/types/social";

type Tab = "queued" | "published" | "failed";

export function QueueContent({
  connectedAccounts,
  queued,
  published,
  failed,
}: {
  connectedAccounts: SocialAccountPublic[];
  queued: PublicationWithPost[];
  published: PublicationWithPost[];
  failed: PublicationWithPost[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("queued");
  const router = useRouter();

  function handleRefresh() {
    router.refresh();
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "queued", label: "Queued", count: queued.length },
    { key: "published", label: "Published", count: published.length },
    { key: "failed", label: "Failed", count: failed.length },
  ];

  const currentItems = activeTab === "queued" ? queued : activeTab === "published" ? published : failed;

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Content Queue</h2>
        <p className="mt-1 text-muted-foreground">
          Manage and schedule your social media posts.
        </p>
      </div>

      <ComposeForm connectedAccounts={connectedAccounts} onPublished={handleRefresh} />

      <div className="mt-8">
        <div className="flex gap-1 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {currentItems.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              {activeTab === "queued" && "No posts in queue. Create your first post above."}
              {activeTab === "published" && "No published posts yet."}
              {activeTab === "failed" && "No failed posts."}
            </p>
          ) : (
            currentItems.map((pub) => (
              <QueueItem key={pub.id} publication={pub} onAction={handleRefresh} />
            ))
          )}
        </div>
      </div>
    </>
  );
}
