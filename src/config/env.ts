import { z } from "zod";

const envSchema = z.object({
  APP_BRAND_NAME: z.string().default("DişçiBul"),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  GOOGLE_PROVIDER: z.enum(["mock", "google"]).default("mock"),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
});

export const env = envSchema.parse({
  APP_BRAND_NAME: process.env.APP_BRAND_NAME,
  APP_BASE_URL: process.env.APP_BASE_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  GOOGLE_PROVIDER: process.env.GOOGLE_PROVIDER,
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
});
