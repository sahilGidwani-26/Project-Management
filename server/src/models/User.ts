import { Schema, model, Document, Types } from "mongoose";

export interface INotificationPreferences {
  taskAssigned: boolean;
  mentions: boolean;
  comments: boolean;
  deadlines: boolean;
  workspaceInvites: boolean;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  profileImage?: string;
  jobTitle?: string;
  bio?: string;
  timezone?: string;
  accountStatus: "active" | "suspended";
  emailVerified: boolean;
  isSuperAdmin: boolean;
  lastLoginAt?: Date;
  passwordResetTokenHash?: string;
  passwordResetExpires?: Date;
  emailVerificationTokenHash?: string;
  notificationPreferences: INotificationPreferences;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, select: false },
    googleId: { type: String, index: true },
    profileImage: String,
    jobTitle: String,
    bio: String,
    timezone: { type: String, default: "UTC" },
    accountStatus: { type: String, enum: ["active", "suspended"], default: "active" },
    emailVerified: { type: Boolean, default: false },
    isSuperAdmin: { type: Boolean, default: false },
    lastLoginAt: Date,
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    emailVerificationTokenHash: { type: String, select: false },
    notificationPreferences: {
      taskAssigned: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      deadlines: { type: Boolean, default: true },
      workspaceInvites: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);
