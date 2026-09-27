import { z } from "zod";

export const createTaskSchema = z.object({
  body: z.object({
    workspaceId: z.string().min(1),
    projectId: z.string().min(1),
    title: z.string().min(1).max(200),
    description: z.string().max(5000).optional(),
    assigneeId: z.string().optional(),
    status: z.enum(["Backlog", "Todo", "In Progress", "In Review", "Done"]).default("Todo"),
    priority: z.enum(["Low", "Medium", "High", "Urgent"]).default("Medium"),
    dueDate: z.string().datetime().optional(),
    labels: z.array(z.string()).optional(),
  }),
  query: z.any(),
  params: z.any(),
});

export const updateTaskStatusSchema = z.object({
  body: z.object({
    status: z.enum(["Backlog", "Todo", "In Progress", "In Review", "Done"]),
    order: z.number().optional(),
  }),
  query: z.any(),
  params: z.any(),
});
