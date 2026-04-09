import { NextResponse } from "next/server";
import { getAllActiveUsersService } from "@/lib/supabase/burnout";
import { checkBurnout } from "@/lib/burnout/detector";
import { publishSurvivalContent } from "@/lib/burnout/survival-publisher";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userIds = await getAllActiveUsersService();
    const results = [];

    for (const userId of userIds) {
      // Check burnout status
      const burnoutResult = await checkBurnout(userId);

      // If in survival mode, try to publish evergreen content
      let survivalPublish = null;
      const supabase = createServiceClient();
      const { data: status } = await supabase
        .from("burnout_status")
        .select("mode")
        .eq("user_id", userId)
        .single();

      if (status?.mode === "survival") {
        survivalPublish = await publishSurvivalContent(userId);
      }

      results.push({
        userId,
        burnout: burnoutResult,
        survivalPublish,
      });
    }

    return NextResponse.json({
      processed: userIds.length,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Burnout check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
