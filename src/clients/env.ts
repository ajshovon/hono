import { z } from 'zod';

const envSchema = z.object({
  JWT_SECRET: z.string(),
  DEFAULT_EMAIL: z.string().email(),
  DEFAULT_PASS: z.string(),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error('Invalid environment variables:', env.error.format());
  process.exit(1);
}

export const { JWT_SECRET, DEFAULT_EMAIL, DEFAULT_PASS } = env.data;
