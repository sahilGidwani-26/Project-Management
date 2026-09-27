import { Schema, model, Document, Types } from "mongoose";

export type ProjectStatus = "Planning" | "Active" | "On Hold" | "Completed" | "Archived";
export type Priority = "Low" | "Medium" | "High" | "Urgent";

export interface IProject extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  managerId?: Types.ObjectId;
  members: Types.ObjectId[];
  status: ProjectStatus;
  priority: Priority;
  startDate?: Date;
  endDate?: Date;
  color: string;
  coverImage?: string;
  progress: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, index: true },
    description: String,
    managerId: { type: Schema.Types.ObjectId, ref: "User" },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    status: { type: String, enum: ["Planning", "Active", "On Hold", "Completed", "Archived"], default: "Planning" },
    priority: { type: String, enum: ["Low", "Medium", "High", "Urgent"], default: "Medium" },
    startDate: Date,
    endDate: Date,
    color: { type: String, default: "#6366F1" },
    coverImage: String,
    progress: { type: Number, default: 0, min: 0, max: 100 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

projectSchema.index({ workspaceId: 1, slug: 1 }, { unique: true });

export const Project = model<IProject>("Project", projectSchema);
