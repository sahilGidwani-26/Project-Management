import { Schema, model, Document, Types } from "mongoose";

export type WorkspaceRole = "OWNER" | "ADMIN" | "PROJECT_MANAGER" | "MEMBER" | "VIEWER";

export interface IWorkspaceMember extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  userId: Types.ObjectId;
  role: WorkspaceRole;
  status: "active" | "removed";
  joinedAt: Date;
}

const workspaceMemberSchema = new Schema<IWorkspaceMember>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: {
      type: String,
      enum: ["OWNER", "ADMIN", "PROJECT_MANAGER", "MEMBER", "VIEWER"],
      default: "MEMBER",
    },
    status: { type: String, enum: ["active", "removed"], default: "active" },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

workspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

export const WorkspaceMember = model<IWorkspaceMember>("WorkspaceMember", workspaceMemberSchema);
