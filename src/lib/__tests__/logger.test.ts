import { test, expect, vi, afterEach } from "vitest";
import { createRequestLogger, generateRequestId } from "@/lib/logger";

afterEach(() => {
  vi.restoreAllMocks();
});

test("generates a unique request id", () => {
  const a = generateRequestId();
  const b = generateRequestId();

  expect(a).not.toBe(b);
  expect(a).toMatch(/^[0-9a-f-]{36}$/);
});

test("defaults to a generated request id when none is provided", () => {
  const logger = createRequestLogger();

  expect(logger.requestId).toMatch(/^[0-9a-f-]{36}$/);
});

test("includes the requestId and message in every log entry", () => {
  const spy = vi.spyOn(console, "log").mockImplementation(() => {});
  const logger = createRequestLogger("test-request-id");

  logger.info("UI generation request started", { projectId: "proj-1" });

  expect(spy).toHaveBeenCalledTimes(1);
  const entry = JSON.parse(spy.mock.calls[0][0]);
  expect(entry).toMatchObject({
    level: "info",
    message: "UI generation request started",
    requestId: "test-request-id",
    projectId: "proj-1",
  });
  expect(entry.timestamp).toBeDefined();
});

test("routes error logs to console.error", () => {
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  const logger = createRequestLogger("test-request-id");

  logger.error("UI generation request failed", { error: "boom" });

  expect(spy).toHaveBeenCalledTimes(1);
  const entry = JSON.parse(spy.mock.calls[0][0]);
  expect(entry).toMatchObject({
    level: "error",
    message: "UI generation request failed",
    requestId: "test-request-id",
    error: "boom",
  });
});
