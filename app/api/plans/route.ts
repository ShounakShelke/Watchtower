import { NextResponse } from "next/server";
import { z } from "zod";
import { user } from "@/lib/data";
import { generateDailyPlan, replanDay } from "@/lib/planning/engine";

const planReqSchema = z.object({
  tired: z.boolean().optional(),
  availableMinutes: z.number().int().positive().optional(),
  maxWorkHours: z.number().int().min(1).max(16).optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => ({}));
    const body = planReqSchema.parse(json);
    const u = await user();

    const plan = await replanDay(
      u.id,
      "user_requested",
      "Manual daily plan generated via Plans API",
      body
    );

    return NextResponse.json(plan);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

