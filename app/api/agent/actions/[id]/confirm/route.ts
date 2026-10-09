import { NextResponse } from "next/server";
import { confirmActionRequest } from "@/lib/agent/action-executor";
import { user } from "@/lib/data";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const u = await user();
    const result = await confirmActionRequest(id, u.id);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to confirm action request." },
      { status: 400 }
    );
  }
}

