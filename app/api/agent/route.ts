import { NextResponse } from "next/server";
import { z } from "zod";
import { processAgentMessage } from "@/lib/agent/orchestrator";
import { user } from "@/lib/data";

const bodySchema = z.object({
  message: z.string().trim().min(1).max(3000),
  sessionId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = bodySchema.parse(json);
    const u = await user();

    const response = await processAgentMessage(u.id, body.message, body.sessionId);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Agent endpoint error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid agent command payload.", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error?.message || "Watchtower could not process that request." },
      { status: 500 }
    );
  }
}
