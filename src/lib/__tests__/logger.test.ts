import { test, expect, vi, afterEach } from "vitest";
import { logger, createRequestId } from "@/lib/logger";

afterEach(() => {
  vi.restoreAllMocks();
});

test("createRequestId returns a unique string each call", () => {
  const a = createRequestId();
  const b = createRequestId();

  expect(typeof a).toBe("string");
  expect(a).not.toBe(b);
});

test("logger.info writes a structured JSON entry to stdout", () => {
  const spy = vi.spyOn(console, "log").mockImplementation(() => {});

  logger.info("UI generation request started", {
    requestId: "req-1",
    projectId: "proj-1",
  });

  expect(spy).toHaveBeenCalledTimes(1);
  const entry = JSON.parse(spy.mock.calls[0][0]);

  expect(entry.level).toBe("info");
  expect(entry.message).toBe("UI generation request started");
  expect(entry.requestId).toBe("req-1");
  expect(entry.projectId).toBe("proj-1");
  expect(typeof entry.timestamp).toBe("string");
});

test("logger.error writes a structured JSON entry to stderr", () => {
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});

  logger.error("UI generation request failed", {
    requestId: "req-2",
    error: "boom",
  });

  expect(spy).toHaveBeenCalledTimes(1);
  const entry = JSON.parse(spy.mock.calls[0][0]);

  expect(entry.level).toBe("error");
  expect(entry.error).toBe("boom");
});

test("logger.warn writes a structured JSON entry via console.warn", () => {
  const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

  logger.warn("something looked off", { requestId: "req-3" });

  expect(spy).toHaveBeenCalledTimes(1);
  const entry = JSON.parse(spy.mock.calls[0][0]);

  expect(entry.level).toBe("warn");
  expect(entry.requestId).toBe("req-3");
});
