import { Schema, model, Document, Types } from "mongoose";

export interface IComment extends Document {
  _id: Types.ObjectId;
  taskId: Types.ObjectId;
  userId: Types.ObjectId;
  content: string;
  parentCommentId?: Types.ObjectId;
  mentions: Types.ObjectId[];
  reactions: { emoji: string; userId: Types.ObjectId }[];
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    parentCommentId: { type: Schema.Types.ObjectId, ref: "Comment" },
    mentions: [{ type: Schema.Types.ObjectId, ref: "User" }],
    reactions: [
      {
        emoji: String,
        userId: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],
  },
  { timestamps: true }
);

export const Comment = model<IComment>("Comment", commentSchema);
