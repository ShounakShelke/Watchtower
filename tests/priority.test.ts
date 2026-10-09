import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateTaskScore } from "../lib/priority";
import { Priority, TaskStatus } from "../lib/types";

describe("Deterministic Priority Engine", () => {
  const now = new Date("2026-10-08T10:00:00Z").getTime();

  it("should score CRITICAL higher than LOW when deadlines are equal", () => {
    const crit = calculateTaskScore(
      { priority: Priority.CRITICAL, dueDate: null, status: TaskStatus.TODO },
      now
    );
    const low = calculateTaskScore(
      { priority: Priority.LOW, dueDate: null, status: TaskStatus.TODO },
      now
    );
    assert.ok(crit.score > low.score);
  });

  it("should apply overdue bonus for tasks past due date", () => {
    const overdueDate = new Date("2026-10-06T10:00:00Z");
    const overdue = calculateTaskScore(
      { priority: Priority.HIGH, dueDate: overdueDate, status: TaskStatus.TODO },
      now
    );
    const futureDate = new Date("2026-10-20T10:00:00Z");
    const future = calculateTaskScore(
      { priority: Priority.HIGH, dueDate: futureDate, status: TaskStatus.TODO },
      now
    );
    assert.ok(overdue.score > future.score);
    assert.ok(overdue.reason.includes("overdue"));
  });

  it("should apply bonus for IN_PROGRESS status", () => {
    const todo = calculateTaskScore(
      { priority: Priority.HIGH, dueDate: null, status: TaskStatus.TODO },
      now
    );
    const inProgress = calculateTaskScore(
      { priority: Priority.HIGH, dueDate: null, status: TaskStatus.IN_PROGRESS },
      now
    );
    assert.equal(inProgress.score, todo.score + 8);
  });
});
