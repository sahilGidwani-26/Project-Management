import { z } from "zod";

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    description: z.string().max(500).optional(),
    slug: z
      .string()
      .min(2)
      .max(50)
      .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
    logo: z.string().url().optional(),
  }),
  query: z.any(),
  params: z.any(),
});

export const inviteMemberSchema = z.object({
  body: z.object({
    email: z.string().email(),
    role: z.enum(["ADMIN", "PROJECT_MANAGER", "MEMBER", "VIEWER"]).default("MEMBER"),
  }),
  query: z.any(),
  params: z.any(),
});
