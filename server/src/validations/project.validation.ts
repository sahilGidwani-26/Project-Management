import { z } from "zod";

export const createProjectSchema = z.object({
  body: z.object({
    workspaceId: z.string().min(1),
    name: z.string().min(2).max(120),
    description: z.string().max(2000).optional(),
    managerId: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    priority: z.enum(["Low", "Medium", "High", "Urgent"]).default("Medium"),
    color: z.string().optional(),
  }),
  query: z.any(),
  params: z.any(),
});
