import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.doUnmock("redis");
  vi.resetModules();
  vi.unstubAllEnvs();
  delete (globalThis as { redisClient?: unknown }).redisClient;
  delete (globalThis as { redisConnection?: unknown }).redisConnection;
});

describe("Redis connection recovery", () => {
  it("creates a fresh client after an established connection ends", async () => {
    vi.stubEnv("REDIS_URL", "redis://cache.example.test:6379");
    const endHandlers: Array<() => void> = [];
    const clients = [0, 1].map((index) => ({
      id: index,
      isReady: false,
      isOpen: false,
      on: vi.fn((event: string, handler: () => void) => {
        if (event === "end") endHandlers[index] = handler;
      }),
      connect: vi.fn(async function (this: { isReady: boolean; isOpen: boolean }) {
        this.isOpen = true;
        this.isReady = true;
      }),
      ping: vi.fn(async () => "PONG"),
    }));
    const createClient = vi.fn()
      .mockReturnValueOnce(clients[0])
      .mockReturnValueOnce(clients[1]);
    vi.doMock("redis", () => ({ createClient }));

    const { getRedisClient } = await import("../src/lib/redis");
    expect(await getRedisClient()).toBe(clients[0]);

    clients[0].isReady = false;
    clients[0].isOpen = false;
    endHandlers[0]();

    expect(await getRedisClient()).toBe(clients[1]);
    expect(createClient).toHaveBeenCalledTimes(2);
  });
});
