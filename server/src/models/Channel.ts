import { Schema, model, Document, Types } from "mongoose";

/**
 * Chat channel, scoped to a workspace (like a Slack channel) or a
 * direct-message thread between two members. This is the separate
 * "Team Chat" feature — distinct from task comments/documentation.
 */
export interface IChannel extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  type: "channel" | "dm";
  name?: string; // required for type "channel", e.g. "general", "design-team"
  description?: string;
  isPrivate: boolean;
  members: Types.ObjectId[];
  createdBy: Types.ObjectId;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const channelSchema = new Schema<IChannel>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    type: { type: String, enum: ["channel", "dm"], default: "channel" },
    name: { type: String, trim: true, lowercase: true },
    description: String,
    isPrivate: { type: Boolean, default: false },
    members: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lastMessageAt: Date,
  },
  { timestamps: true }
);

channelSchema.index({ workspaceId: 1, name: 1 }, { unique: true, partialFilterExpression: { type: "channel" } });

export const Channel = model<IChannel>("Channel", channelSchema);
