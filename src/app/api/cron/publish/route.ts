import { NextResponse } from "next/server";
import { getScheduledPublicationsForCron } from "@/lib/supabase/publications";
import { publishSinglePublication, resolvePostStatus } from "@/lib/social/publisher";

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const publications = await getScheduledPublicationsForCron(10);

    if (publications.length === 0) {
      return NextResponse.json({ processed: 0, published: 0, failed: 0 });
    }

    let published = 0;
    let failed = 0;
    const processedPostIds = new Set<string>();

    for (const pub of publications) {
      await publishSinglePublication(pub);
      processedPostIds.add(pub.post_id);

      // Check the result
      const wasPublished = pub.status !== "failed";
      if (wasPublished) published++;
      else failed++;
    }

    // Resolve post statuses
    for (const postId of processedPostIds) {
      await resolvePostStatus(postId);
    }

    return NextResponse.json({
      processed: publications.length,
      published,
      failed,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cron execution failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
