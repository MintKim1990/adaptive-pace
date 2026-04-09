"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformIcon, getPlatformName } from "./platform-icons";
import type { SocialAccountPublic, SocialPlatform } from "@/types/social";

interface SocialAccountCardProps {
  platform: SocialPlatform;
  account: SocialAccountPublic | null;
  onConnect: () => void;
  onDisconnected: () => void;
}

export function SocialAccountCard({ platform, account, onConnect, onDisconnected }: SocialAccountCardProps) {
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch(`/api/social/${platform}/disconnect`, { method: "POST" });
      if (res.ok) {
        onDisconnected();
      }
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
        <PlatformIcon platform={platform} className="h-6 w-6 shrink-0" />
        <CardTitle className="text-base">{getPlatformName(platform)}</CardTitle>
        <div className="ml-auto">
          {account ? (
            <Badge className="bg-green-500 text-white">Connected</Badge>
          ) : (
            <Badge variant="secondary">Not connected</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {account ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {account.avatar_url && (
                <img
                  src={account.avatar_url}
                  alt=""
                  className="h-8 w-8 rounded-full"
                />
              )}
              <div>
                <p className="text-sm font-medium">{account.display_name || account.platform_username}</p>
                {account.platform_username && account.display_name && (
                  <p className="text-xs text-muted-foreground">@{account.platform_username}</p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? "Disconnecting..." : "Disconnect"}
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={onConnect}>
            Connect
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
