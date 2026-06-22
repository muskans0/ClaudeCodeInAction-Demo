import { test, expect, vi, beforeEach } from "vitest";
import { TextEncoder } from "util";

// jsdom's TextEncoder produces Uint8Arrays from a different realm than
// jose expects, which makes `instanceof Uint8Array` checks fail during
// signing. Swap in Node's TextEncoder so JWT_SECRET encodes correctly.
vi.stubGlobal("TextEncoder", TextEncoder);

vi.mock("server-only", () => ({}));

const cookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(cookieStore)),
}));

const { createSession } = await import("@/lib/auth");

beforeEach(() => {
  vi.clearAllMocks();
});

test("createSession sets an auth-token cookie with the expected options", async () => {
  await createSession("user-1", "user@example.com");

  expect(cookieStore.set).toHaveBeenCalledTimes(1);
  const [name, token, options] = cookieStore.set.mock.calls[0];

  expect(name).toBe("auth-token");
  expect(typeof token).toBe("string");
  expect(token.split(".")).toHaveLength(3); // JWT has 3 segments

  expect(options).toMatchObject({
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  expect(options.expires).toBeInstanceOf(Date);
});

test("createSession encodes the userId and email in the token payload", async () => {
  await createSession("user-42", "person@example.com");

  const [, token] = cookieStore.set.mock.calls[0];
  const payload = JSON.parse(
    Buffer.from(token.split(".")[1], "base64url").toString("utf8")
  );

  expect(payload.userId).toBe("user-42");
  expect(payload.email).toBe("person@example.com");
  expect(payload.expiresAt).toBeDefined();
});

test("createSession sets an expiry roughly 7 days in the future", async () => {
  const before = Date.now();
  await createSession("user-1", "user@example.com");
  const after = Date.now();

  const [, , options] = cookieStore.set.mock.calls[0];
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  expect(options.expires.getTime()).toBeGreaterThanOrEqual(
    before + sevenDaysMs - 1000
  );
  expect(options.expires.getTime()).toBeLessThanOrEqual(
    after + sevenDaysMs + 1000
  );
});

test("createSession marks the cookie secure only in production", async () => {
  const originalEnv = process.env.NODE_ENV;

  process.env.NODE_ENV = "production";
  await createSession("user-1", "user@example.com");
  expect(cookieStore.set.mock.calls[0][2].secure).toBe(true);

  vi.clearAllMocks();

  process.env.NODE_ENV = "development";
  await createSession("user-1", "user@example.com");
  expect(cookieStore.set.mock.calls[0][2].secure).toBe(false);

  process.env.NODE_ENV = originalEnv;
});
