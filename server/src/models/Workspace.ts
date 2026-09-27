import { Schema, model, Document, Types } from "mongoose";

export interface IWorkspace extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  slug: string;
  logo?: string;
  ownerId: Types.ObjectId;
  status: "active" | "suspended";
  settings: {
    defaultTaskStatuses: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const workspaceSchema = new Schema<IWorkspace>(
  {
    name: { type: String, required: true, trim: true },
    description: String,
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    logo: String,
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    settings: {
      defaultTaskStatuses: {
        type: [String],
        default: ["Backlog", "Todo", "In Progress", "In Review", "Done"],
      },
    },
  },
  { timestamps: true }
);

export const Workspace = model<IWorkspace>("Workspace", workspaceSchema);
