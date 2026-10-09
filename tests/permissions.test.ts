import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { executeWithPermissions } from "../lib/agent/permissions";
import { ToolDefinition } from "../lib/types";

describe("Permission Guardrails Enforcement", () => {
  it("should immediately execute READ tools", async () => {
    let executed = false;
    const testReadTool: ToolDefinition = {
      name: "test_read",
      description: "Test read tool",
      permission: "READ",
      schema: null as any,
      execute: async () => {
        executed = true;
        return { data: "read_ok" };
      },
    };

    const outcome = await executeWithPermissions(
      testReadTool,
      {},
      { userId: "test-user-1" }
    );
    assert.equal(executed, true);
    assert.equal(outcome.status, "SUCCESS");
    assert.equal(outcome.result.data, "read_ok");
  });

  it("should require userId for INTERNAL_WRITE tools", async () => {
    const testWriteTool: ToolDefinition = {
      name: "test_write",
      description: "Test internal write",
      permission: "INTERNAL_WRITE",
      schema: null as any,
      execute: async () => ({ updated: true }),
    };

    const unauthOutcome = await executeWithPermissions(testWriteTool, {}, { userId: "" });
    assert.equal(unauthOutcome.status, "ERROR");
    assert.ok(unauthOutcome.error?.includes("Unauthorized"));
  });

  it("should never execute EXTERNAL_WRITE tools directly without confirmation", async () => {
    let externallyMutated = false;
    const testExternalTool: ToolDefinition = {
      name: "calendar_create_event",
      description: "Create external calendar event",
      permission: "EXTERNAL_WRITE",
      schema: null as any,
      execute: async () => {
        externallyMutated = true;
        return { created: true };
      },
    };

    const context = { userId: "test-user-1" };
    const input = {
      title: "Doctor Appointment",
      startTime: "2026-10-09T14:00:00Z",
      endTime: "2026-10-09T15:00:00Z",
    };

    // Mock prisma for standalone testing
    const originalPrismaCreate = (await import("../lib/prisma")).prisma.agentActionRequest.create;
    (await import("../lib/prisma")).prisma.agentActionRequest.create = (async (args: any) => ({
      id: "action-req-123",
      userId: args.data.userId,
      toolName: args.data.toolName,
      actionType: args.data.actionType,
      targetJson: args.data.targetJson,
      beforeJson: args.data.beforeJson,
      proposedAfterJson: args.data.proposedAfterJson,
      status: "PENDING",
      expiresAt: args.data.expiresAt,
    })) as any;

    try {
      const outcome = await executeWithPermissions(testExternalTool, input, context);

      // Verify the external mutation did NOT happen
      assert.equal(externallyMutated, false);
      assert.equal(outcome.status, "NEEDS_CONFIRMATION");
      assert.ok(outcome.actionRequest);
      assert.equal(outcome.actionRequest?.toolName, "calendar_create_event");
      assert.equal(outcome.actionRequest?.actionType, "CREATE_EVENT");
      assert.ok(outcome.actionRequest?.consequence.includes("Doctor Appointment"));
    } finally {
      (await import("../lib/prisma")).prisma.agentActionRequest.create = originalPrismaCreate;
    }
  });
});

