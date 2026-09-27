import { Schema, model, Document, Types } from "mongoose";

export type TaskStatus = "Backlog" | "Todo" | "In Progress" | "In Review" | "Done";
export type Priority = "Low" | "Medium" | "High" | "Urgent";

export interface ITask extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  projectId: Types.ObjectId;
  title: string;
  description?: string;
  assigneeIds: Types.ObjectId[];
  reporterId: Types.ObjectId;
  status: TaskStatus;
  priority: Priority;
  startDate?: Date;
  dueDate?: Date;
  estimatedMinutes?: number;
  actualMinutes?: number;
  labels: string[];
  milestoneId?: Types.ObjectId;
  parentTaskId?: Types.ObjectId;
  dependencies: Types.ObjectId[];
  order: number;
  recurrence?: {
    frequency: "daily" | "weekly" | "monthly" | "custom";
    intervalDays?: number; // used when frequency = "custom"
    active: boolean;
  };
  recurrenceSourceId?: Types.ObjectId; // set on generated occurrences, points to the original recurring task
  dueReminderSentAt?: Date; // prevents sending the "due soon" email more than once
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: String,
    assigneeIds: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["Backlog", "Todo", "In Progress", "In Review", "Done"], default: "Todo", index: true },
    priority: { type: String, enum: ["Low", "Medium", "High", "Urgent"], default: "Medium" },
    startDate: Date,
    dueDate: Date,
    estimatedMinutes: Number,
    actualMinutes: { type: Number, default: 0 },
    labels: [String],
    milestoneId: { type: Schema.Types.ObjectId, ref: "Milestone" },
    parentTaskId: { type: Schema.Types.ObjectId, ref: "Task", index: true },
    dependencies: [{ type: Schema.Types.ObjectId, ref: "Task" }],
    order: { type: Number, default: 0 },
    recurrence: {
      frequency: { type: String, enum: ["daily", "weekly", "monthly", "custom"] },
      intervalDays: Number,
      active: { type: Boolean, default: false },
    },
    recurrenceSourceId: { type: Schema.Types.ObjectId, ref: "Task" },
    dueReminderSentAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ title: "text", description: "text" });

export const Task = model<ITask>("Task", taskSchema);