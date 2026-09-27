import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { ApiError } from "../utils/ApiError";
import { sendSuccess, sendPaginated } from "../utils/ApiResponse";
import { Channel } from "../models/Channel";
import { Message } from "../models/Message";
import { Notification } from "../models/Notification";

/**
 * Team Chat (Slack-style), separate from task comments.
 * Channels belong to a workspace; direct messages are 2-member "dm" channels.
 * Real-time delivery happens over Socket.io rooms named `channel:<channelId>`.
 */

export const createChannel = catchAsync(async (req: Request, res: Response) => {
  const { workspaceId, name, description, isPrivate, members } = req.body;
  const userId = req.user!.id;

  const existing = await Channel.findOne({ workspaceId, name, type: "channel" });
  if (existing) throw ApiError.conflict("A channel with this name already exists");

  const channel = await Channel.create({
    workspaceId,
    type: "channel",
    name,
    description,
    isPrivate,
    members: Array.from(new Set([userId, ...(members || [])])),
    createdBy: userId,
  });

  return sendSuccess(res, 201, channel, "Channel created");
});

export const listChannels = catchAsync(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const userId = req.user!.id;

  // Public channels in the workspace + private channels/DMs the user belongs to.
  const channels = await Channel.find({
    workspaceId,
    $or: [{ isPrivate: false }, { members: userId }],
  }).sort({ lastMessageAt: -1, createdAt: -1 });

  return sendSuccess(res, 200, channels, "Channels");
});

export const getOrCreateDM = catchAsync(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const { otherUserId } = req.body;
  const userId = req.user!.id;

  let dm = await Channel.findOne({
    workspaceId,
    type: "dm",
    members: { $all: [userId, otherUserId], $size: 2 },
  });

  if (!dm) {
    dm = await Channel.create({
      workspaceId,
      type: "dm",
      members: [userId, otherUserId],
      createdBy: userId,
    });
  }

  return sendSuccess(res, 200, dm, "Direct message channel");
});

export const joinChannel = catchAsync(async (req: Request, res: Response) => {
  const channel = await Channel.findByIdAndUpdate(
    req.params.channelId,
    { $addToSet: { members: req.user!.id } },
    { new: true }
  );
  if (!channel) throw ApiError.notFound("Channel not found");
  return sendSuccess(res, 200, channel, "Joined channel");
});

export const listMessages = catchAsync(async (req: Request, res: Response) => {
  const { channelId } = req.params;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 30;

  const [items, total] = await Promise.all([
    Message.find({ channelId, deletedAt: { $exists: false } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("senderId", "name profileImage"),
    Message.countDocuments({ channelId }),
  ]);

  return sendPaginated(res, items.reverse(), page, limit, total, "Messages");
});

export const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const { channelId } = req.params;
  const { content, mentions, parentMessageId } = req.body;
  const userId = req.user!.id;

  const channel = await Channel.findById(channelId);
  if (!channel) throw ApiError.notFound("Channel not found");
  if (!channel.members.map(String).includes(userId) && channel.isPrivate) {
    throw ApiError.forbidden("You are not a member of this channel");
  }

  const message = await Message.create({
    channelId,
    workspaceId: channel.workspaceId,
    senderId: userId,
    content,
    mentions: mentions || [],
    parentMessageId,
  });
  await message.populate("senderId", "name profileImage");

  channel.lastMessageAt = new Date();
  await channel.save();

  // Real-time broadcast to everyone currently in the channel room.
  req.app.get("io").to(`channel:${channelId}`).emit("message:new", message);

  if (mentions?.length) {
    await Promise.all(
      mentions.map((mUserId: string) =>
        Notification.create({
          userId: mUserId,
          type: "mention",
          title: "You were mentioned in chat",
          message: content.slice(0, 120),
          relatedWorkspaceId: channel.workspaceId,
        })
      )
    );
    mentions.forEach((mUserId: string) => {
      req.app.get("io").to(`user:${mUserId}`).emit("notification:new", { title: "You were mentioned in chat" });
    });
  }

  return sendSuccess(res, 201, message, "Message sent");
});

export const editMessage = catchAsync(async (req: Request, res: Response) => {
  const message = await Message.findOneAndUpdate(
    { _id: req.params.messageId, senderId: req.user!.id },
    { content: req.body.content, editedAt: new Date() },
    { new: true }
  );
  if (!message) throw ApiError.notFound("Message not found or not owned by you");

  req.app.get("io").to(`channel:${message.channelId}`).emit("message:updated", message);
  return sendSuccess(res, 200, message, "Message updated");
});

export const deleteMessage = catchAsync(async (req: Request, res: Response) => {
  const message = await Message.findOneAndUpdate(
    { _id: req.params.messageId, senderId: req.user!.id },
    { deletedAt: new Date() },
    { new: true }
  );
  if (!message) throw ApiError.notFound("Message not found or not owned by you");

  req.app.get("io").to(`channel:${message.channelId}`).emit("message:deleted", { messageId: message._id });
  return sendSuccess(res, 200, null, "Message deleted");
});

export const addReaction = catchAsync(async (req: Request, res: Response) => {
  const { emoji } = req.body;
  const message = await Message.findByIdAndUpdate(
    req.params.messageId,
    { $push: { reactions: { emoji, userId: req.user!.id } } },
    { new: true }
  );
  if (!message) throw ApiError.notFound("Message not found");

  req.app.get("io").to(`channel:${message.channelId}`).emit("message:reaction", { messageId: message._id, emoji, userId: req.user!.id });
  return sendSuccess(res, 200, message, "Reaction added");
});
