import { Schema, model, Document, Types } from "mongoose";

export interface IInvitation extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  email: string;
  role: string;
  token: string;
  invitedBy: Types.ObjectId;
  status: "pending" | "accepted" | "expired" | "cancelled";
  expiresAt: Date;
  createdAt: Date;
}

const invitationSchema = new Schema<IInvitation>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    email: { type: String, required: true, lowercase: true },
    role: { type: String, default: "MEMBER" },
    token: { type: String, required: true, unique: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "expired", "cancelled"], default: "pending" },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export const Invitation = model<IInvitation>("Invitation", invitationSchema);
