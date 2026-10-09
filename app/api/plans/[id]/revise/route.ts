import { NextResponse } from "next/server";
import { z } from "zod";
import { user } from "@/lib/data";
import { replanDay } from "@/lib/planning/engine";

const reviseSchema = z.object({
  trigger: z.string().min(1),
  reason: z.string().min(1),
  availableMinutes: z.number().int().positive().optional(),
  tired: z.boolean().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await request.json();
    const body = reviseSchema.parse(json);
    const u = await user();

    const result = await replanDay(u.id, body.trigger, body.reason, {
      availableMinutes: body.availableMinutes,
      tired: body.tired,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

