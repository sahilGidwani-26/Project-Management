import { Schema, model, Document, Types } from "mongoose";

export type NotificationType =
  | "task_assigned"
  | "mention"
  | "comment"
  | "deadline"
  | "task_completed"
  | "project_updated"
  | "workspace_invite";

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  relatedWorkspaceId?: Types.ObjectId;
  relatedProjectId?: Types.ObjectId;
  relatedTaskId?: Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedWorkspaceId: { type: Schema.Types.ObjectId, ref: "Workspace" },
    relatedProjectId: { type: Schema.Types.ObjectId, ref: "Project" },
    relatedTaskId: { type: Schema.Types.ObjectId, ref: "Task" },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Notification = model<INotification>("Notification", notificationSchema);
