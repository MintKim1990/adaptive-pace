import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPostById } from "@/lib/supabase/posts";
import { publishSinglePublication, resolvePostStatus } from "@/lib/social/publisher";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const post = await getPostById(id);

  if (!post || post.user_id !== user.id) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (post.status === "published") {
    return NextResponse.json({ error: "Post already published" }, { status: 400 });
  }

  try {
    const serviceClient = createServiceClient();
    const { data: pubs } = await serviceClient
      .from("publications")
      .select("*, posts(*), social_accounts(*)")
      .eq("post_id", id)
      .in("status", ["scheduled", "failed"]);

    if (!pubs?.length) {
      return NextResponse.json({ error: "No publications to publish" }, { status: 400 });
    }

    for (const pub of pubs) {
      await publishSinglePublication(pub);
    }

    await resolvePostStatus(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Publish failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
