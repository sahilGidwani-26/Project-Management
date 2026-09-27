import { z } from "zod";

export const createChannelSchema = z.object({
  body: z.object({
    workspaceId: z.string().min(1),
    name: z
      .string()
      .min(1)
      .max(60)
      .regex(/^[a-z0-9-]+$/, "Channel name must be lowercase letters, numbers, hyphens"),
    description: z.string().max(300).optional(),
    isPrivate: z.boolean().default(false),
    members: z.array(z.string()).optional(),
  }),
  query: z.any(),
  params: z.any(),
});

export const sendMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(4000),
    mentions: z.array(z.string()).optional(),
    parentMessageId: z.string().optional(),
  }),
  query: z.any(),
  params: z.any(),
});
