import { Schema, model, Document, Types } from "mongoose";

export interface ILabel extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  name: string;
  color: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

const labelSchema = new Schema<ILabel>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: "#6366F1" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

labelSchema.index({ workspaceId: 1, name: 1 }, { unique: true });

export const Label = model<ILabel>("Label", labelSchema);
