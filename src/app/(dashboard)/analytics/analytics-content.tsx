"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlatformIcon, getPlatformName } from "@/components/social/platform-icons";

interface PostAnalytics {
  id: string;
  content: string;
  status: string;
  engagement_score: number;
  is_evergreen: boolean;
  created_at: string;
  publications: {
    id: string;
    platform: string;
    platform_post_id: string | null;
    published_at: string | null;
    analytics: {
      likes: number;
      comments: number;
      reposts: number;
      impressions: number | null;
      fetched_at: string;
    }[];
  }[];
}

export function AnalyticsContent({ posts }: { posts: PostAnalytics[] }) {
  const totalScore = posts.reduce((sum, p) => sum + p.engagement_score, 0);
  const evergreenCount = posts.filter((p) => p.is_evergreen).length;

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Analytics</h2>
        <p className="mt-1 text-muted-foreground">
          Track your content performance across platforms.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Published Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{posts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Engagement Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalScore}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Evergreen Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{evergreenCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Post Performance</h3>
        {posts.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No published posts yet. Publish content from the Queue page to see analytics.
          </p>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </>
  );
}

function PostCard({ post }: { post: PostAnalytics }) {
  const contentPreview = post.content.length > 100 ? post.content.slice(0, 100) + "..." : post.content;

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {post.is_evergreen && (
                <Badge className="bg-amber-500 text-white">Evergreen</Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {new Date(post.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm">{contentPreview}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold">{post.engagement_score}</p>
            <p className="text-xs text-muted-foreground">score</p>
          </div>
        </div>

        {post.publications.length > 0 && (
          <div className="grid gap-2 md:grid-cols-3">
            {post.publications.map((pub) => {
              const analytics = pub.analytics[0];
              return (
                <div key={pub.id} className="flex items-center gap-2 rounded-lg border p-2 text-xs">
                  <PlatformIcon platform={pub.platform as "bluesky" | "linkedin" | "threads"} className="h-4 w-4 shrink-0" />
                  <span className="font-medium">{getPlatformName(pub.platform as "bluesky" | "linkedin" | "threads")}</span>
                  {analytics ? (
                    <span className="ml-auto text-muted-foreground">
                      {analytics.likes}L {analytics.comments}C {analytics.reposts}R
                    </span>
                  ) : (
                    <span className="ml-auto text-muted-foreground">No data</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
