import { Schema, model, Document, Types } from "mongoose";

export interface ISavedView extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  projectId?: Types.ObjectId;
  name: string;
  viewType: "board" | "list" | "calendar" | "timeline";
  filters: Record<string, unknown>;
  sort?: string;
  createdAt: Date;
}

const savedViewSchema = new Schema<ISavedView>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    name: { type: String, required: true },
    viewType: { type: String, enum: ["board", "list", "calendar", "timeline"], default: "list" },
    filters: { type: Schema.Types.Mixed, default: {} },
    sort: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const SavedView = model<ISavedView>("SavedView", savedViewSchema);
