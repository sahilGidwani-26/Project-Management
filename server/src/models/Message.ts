import { Schema, model, Document, Types } from "mongoose";

export interface IMessage extends Document {
  _id: Types.ObjectId;
  channelId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string;
  attachments: { fileName: string; fileUrl: string; fileType: string }[];
  mentions: Types.ObjectId[];
  reactions: { emoji: string; userId: Types.ObjectId }[];
  parentMessageId?: Types.ObjectId; // thread reply
  editedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    channelId: { type: Schema.Types.ObjectId, ref: "Channel", required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileType: String,
      },
    ],
    mentions: [{ type: Schema.Types.ObjectId, ref: "User" }],
    reactions: [
      {
        emoji: String,
        userId: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],
    parentMessageId: { type: Schema.Types.ObjectId, ref: "Message", index: true },
    editedAt: Date,
    deletedAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

messageSchema.index({ channelId: 1, createdAt: -1 });

export const Message = model<IMessage>("Message", messageSchema);
