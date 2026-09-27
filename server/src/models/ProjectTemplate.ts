import { Schema, model, Document, Types } from "mongoose";

export interface ITemplateTask {
  title: string;
  description?: string;
  milestoneTitle?: string;
  estimatedMinutes?: number;
}

export interface IProjectTemplate extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  name: string;
  description?: string;
  milestones: string[];
  tasks: ITemplateTask[];
  createdBy: Types.ObjectId;
  createdAt: Date;
}

const projectTemplateSchema = new Schema<IProjectTemplate>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    name: { type: String, required: true },
    description: String,
    milestones: [String],
    tasks: [
      {
        title: { type: String, required: true },
        description: String,
        milestoneTitle: String,
        estimatedMinutes: Number,
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ProjectTemplate = model<IProjectTemplate>("ProjectTemplate", projectTemplateSchema);
