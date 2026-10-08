import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { user } from "@/lib/data";
const schema=z.object({content:z.string().min(1).max(500000),filename:z.string().max(200).default("chatgpt_history.md")});
export async function POST(request:Request) { try { const {content,filename}=schema.parse(await request.json()); const u=await user(); const chunks=content.split(/(?=^#{1,3}\s)/m).filter(x=>x.trim()).slice(0,300); await prisma.$transaction(chunks.map((content,i)=>prisma.knowledge.create({data:{userId:u.id,title:(content.match(/^#+\s+(.+)/m)?.[1]||`Imported conversation ${i+1}`).slice(0,180),content,sourceType:"chatgpt_import",sourceReference:filename}}))); const projectNames=[...new Set((content.match(/\b(?:Watchtower|GT2|MedLMP)\b/gi)||[]))]; return NextResponse.json({conversationsProcessed:chunks.length,knowledgeEntriesCreated:chunks.length,memoryCandidates:0,projectsDetected:projectNames,warnings:chunks.length?[]:["No conversation headings detected; stored as one entry."]}); } catch { return NextResponse.json({error:"Import a non-empty Markdown file under 500 KB."},{status:400}); } }
