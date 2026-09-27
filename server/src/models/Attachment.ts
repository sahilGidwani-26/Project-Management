import { Schema, model, Document, Types } from "mongoose";

export interface IAttachment extends Document {
  _id: Types.ObjectId;
  taskId?: Types.ObjectId;
  projectId?: Types.ObjectId;
  commentId?: Types.ObjectId;
  uploadedBy: Types.ObjectId;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: Date;
}

const attachmentSchema = new Schema<IAttachment>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Task", index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    commentId: { type: Schema.Types.ObjectId, ref: "Comment" },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Attachment = model<IAttachment>("Attachment", attachmentSchema);
