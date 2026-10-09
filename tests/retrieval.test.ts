import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { hybridSearch } from "../lib/retrieval/engine";
import { prisma } from "../lib/prisma";

describe("Hybrid Retrieval Engine", () => {
  it("should match keywords and return ranked results", async () => {
    const origKnowledge = prisma.knowledge.findMany;
    const origMemory = prisma.memory.findMany;
    const origProject = prisma.project.findMany;

    prisma.knowledge.findMany = (async () => [
      {
        id: "k-1",
        userId: "test-user",
        title: "MedLMP Clinical Architecture",
        content: "We decided to evaluate llama-3 clinical benchmarks on patient intake notes.",
        sourceType: "chatgpt_import",
        embeddings: [],
      },
      {
        id: "k-2",
        userId: "test-user",
        title: "GT2 Aerodynamics Analysis",
        content: "Downforce specifications and wind tunnel verification for GT2 class.",
        sourceType: "chatgpt_import",
        embeddings: [],
      },
    ]) as any;

    prisma.memory.findMany = (async () => [
      {
        id: "m-1",
        userId: "test-user",
        category: "preference",
        key: "focus_time",
        value: "Deep work sessions in the morning before 11 AM",
        confidence: 0.9,
      },
    ]) as any;

    prisma.project.findMany = (async () => []) as any;

    try {
      const results = await hybridSearch("test-user", "MedLMP clinical");
      assert.ok(results.length > 0);
      assert.equal(results[0].id, "k-1");
      assert.equal(results[0].type, "KNOWLEDGE");
      assert.ok(results[0].title.includes("MedLMP"));
    } finally {
      prisma.knowledge.findMany = origKnowledge;
      prisma.memory.findMany = origMemory;
      prisma.project.findMany = origProject;
    }
  });
});

