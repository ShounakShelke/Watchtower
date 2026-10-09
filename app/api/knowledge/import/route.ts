import { NextResponse } from "next/server";
import { z } from "zod";
import { user } from "@/lib/data";
import { ingestChatGPTMarkdown } from "@/lib/ingestion/chatgpt";

const schema = z.object({
  content: z.string().min(1).max(2000000),
  filename: z.string().max(200).default("chatgpt_history.md"),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { content, filename } = schema.parse(json);
    const u = await user();

    const report = await ingestChatGPTMarkdown(u.id, content, filename);

    return NextResponse.json({
      conversationsProcessed: report.conversationsParsed,
      knowledgeEntriesCreated: report.knowledgeRecordsCreated,
      memoryCandidates: report.memoryCandidatesProposed,
      projectsDetected: report.projectsDetected,
      warnings: [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to parse and import knowledge document." },
      { status: 400 }
    );
  }
}
