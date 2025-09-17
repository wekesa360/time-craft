import { z } from 'zod';

// POST /auth/register
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  tz: z.string().optional().default('UTC')
});

// POST /auth/login
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

// POST /auth/refresh
export const refreshSchema = z.object({
  refreshToken: z.string()
});

// Types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput    = z.infer<typeof loginSchema>;
export type RefreshInput  = z.infer<typeof refreshSchema>;