import { NextResponse } from "next/server";
import { z } from "zod";
import { handleAgent } from "@/lib/agent";
const bodySchema=z.object({message:z.string().trim().min(1).max(2000)});
export async function POST(request:Request) { try { const body=bodySchema.parse(await request.json()); return NextResponse.json(await handleAgent(body.message)); } catch(error) { return NextResponse.json({error:error instanceof z.ZodError?"Enter a valid command.":"Watchtower could not process that request."},{status:400}); } }
