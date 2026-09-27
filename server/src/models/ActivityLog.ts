import { Schema, model, Document, Types } from "mongoose";

export interface IActivityLog extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  actorId: Types.ObjectId;
  action: string;
  resourceType: string;
  resourceId: Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    resourceType: { type: String, required: true },
    resourceId: { type: Schema.Types.ObjectId, required: true },
    metadata: Schema.Types.Mixed,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ActivityLog = model<IActivityLog>("ActivityLog", activityLogSchema);
