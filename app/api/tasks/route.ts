import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { user } from "@/lib/data";
const taskSchema=z.object({title:z.string().min(1).max(180),description:z.string().max(2000).optional(),priority:z.enum(["CRITICAL","HIGH","MEDIUM","LOW"]).default("MEDIUM"),estimatedMinutes:z.number().int().positive().max(1440).optional(),dueDate:z.string().datetime().optional(),projectId:z.string().optional()});
export async function POST(request:Request) { try { const data=taskSchema.parse(await request.json()); const u=await user(); const task=await prisma.task.create({data:{...data,userId:u.id,dueDate:data.dueDate?new Date(data.dueDate):undefined}}); return NextResponse.json(task,{status:201}); } catch { return NextResponse.json({error:"Invalid task."},{status:400}); } }
