import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(72),
  }),
  query: z.any(),
  params: z.any(),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
  query: z.any(),
  params: z.any(),
});

export const forgotPasswordSchema = z.object({
  body: z.object({ email: z.string().email() }),
  query: z.any(),
  params: z.any(),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(10),
    password: z.string().min(8).max(72),
  }),
  query: z.any(),
  params: z.any(),
});

export const verifyEmailSchema = z.object({
  body: z.object({ token: z.string().min(10) }),
  query: z.any(),
  params: z.any(),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(72),
  }),
  query: z.any(),
  params: z.any(),
});

export const googleAuthSchema = z.object({
  body: z.object({ idToken: z.string().min(10) }),
  query: z.any(),
  params: z.any(),
});

export const notificationPreferencesSchema = z.object({
  body: z.object({
    taskAssigned: z.boolean().optional(),
    mentions: z.boolean().optional(),
    comments: z.boolean().optional(),
    deadlines: z.boolean().optional(),
    workspaceInvites: z.boolean().optional(),
  }),
  query: z.any(),
  params: z.any(),
});
