import { Schema, model, Document, Types } from "mongoose";

export interface ITimeEntry extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  taskId: Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number;
  createdAt: Date;
}

const timeEntrySchema = new Schema<ITimeEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    startTime: { type: Date, required: true },
    endTime: Date,
    durationMinutes: Number,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const TimeEntry = model<ITimeEntry>("TimeEntry", timeEntrySchema);
