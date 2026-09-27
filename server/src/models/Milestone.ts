import { Schema, model, Document, Types } from "mongoose";

export interface IMilestone extends Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  title: string;
  description?: string;
  dueDate?: Date;
  status: "Upcoming" | "In Progress" | "Completed";
  order: number;
  createdAt: Date;
}

const milestoneSchema = new Schema<IMilestone>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    title: { type: String, required: true },
    description: String,
    dueDate: Date,
    status: { type: String, enum: ["Upcoming", "In Progress", "Completed"], default: "Upcoming" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Milestone = model<IMilestone>("Milestone", milestoneSchema);
