import { createClient } from "redis";

type RedisClient = ReturnType<typeof createClient>;
type RedisGlobals = {
  redisClient?: RedisClient;
  redisConnection?: Promise<RedisClient>;
};

const redisGlobals = globalThis as unknown as RedisGlobals;

function forgetClient(client: RedisClient) {
  if (redisGlobals.redisClient !== client) return;
  redisGlobals.redisClient = undefined;
  redisGlobals.redisConnection = undefined;
}

function createRedisClient() {
  const client = createClient({
    url: process.env.REDIS_URL,
    socket: { connectTimeout: 1_500, reconnectStrategy: false },
  });
  client.on("error", () => undefined);
  client.on("end", () => forgetClient(client));
  return client;
}

export async function getRedisClient() {
  if (!process.env.REDIS_URL) return null;
  if (redisGlobals.redisClient?.isReady) return redisGlobals.redisClient;

  if (redisGlobals.redisClient && !redisGlobals.redisClient.isOpen) {
    forgetClient(redisGlobals.redisClient);
  }

  if (!redisGlobals.redisConnection) {
    const client = redisGlobals.redisClient ?? createRedisClient();
    redisGlobals.redisClient = client;
    redisGlobals.redisConnection = client.connect()
      .then(() => client)
      .catch((error) => {
        forgetClient(client);
        throw error;
      });
  }

  return redisGlobals.redisConnection;
}

export async function pingRedis() {
  const client = await getRedisClient();
  if (!client) return false;
  return (await client.ping()) === "PONG";
}
