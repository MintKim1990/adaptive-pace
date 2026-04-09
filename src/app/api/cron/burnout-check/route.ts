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
      const burnoutResult = await checkBurnout(userId);

      let survivalPublish = null;
      const supabase = createServiceClient();
      const { data: status } = await supabase
        .from("burnout_status")
        .select("mode, survival_enabled, survival_rewrite_mode, survival_frequency, survival_consent_at")
        .eq("user_id", userId)
        .single();

      if (status?.mode === "survival") {
        survivalPublish = await publishSurvivalContent(userId, {
          survival_enabled: status.survival_enabled ?? true,
          survival_rewrite_mode: status.survival_rewrite_mode ?? "original",
          survival_frequency: status.survival_frequency ?? 3,
          survival_consent_at: status.survival_consent_at ?? null,
        });
      }

      results.push({
        userId,
        burnout: burnoutResult,
        survivalPublish,
      });
    }

    return NextResponse.json({ processed: userIds.length, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Burnout check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
