import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { sendSuccess } from "../utils/ApiResponse";
import { Comment } from "../models/Comment";
import { Task } from "../models/Task";
import { Notification } from "../models/Notification";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { sendMail } from "../utils/mailer";
import { taskMentionEmail, buildTaskUrl } from "../utils/emailTemplates";

export const listComments = catchAsync(async (req: Request, res: Response) => {
  const comments = await Comment.find({ taskId: req.params.taskId })
    .sort({ createdAt: 1 })
    .populate("userId", "name profileImage")
    .populate("mentions", "name");
  return sendSuccess(res, 200, comments, "Comments");
});

export const addComment = catchAsync(async (req: Request, res: Response) => {
  const { content, parentCommentId, mentions } = req.body;
  const task = await Task.findById(req.params.taskId).populate<{ projectId: { name: string } }>("projectId", "name");
  if (!task) throw ApiError.notFound("Task not found");

  const comment = await Comment.create({
    taskId: task._id,
    userId: req.user!.id,
    content,
    parentCommentId,
    mentions: mentions || [],
  });
  await comment.populate("userId", "name profileImage");

  const assigneeTargets = task.assigneeIds.map(String).filter((id) => id !== req.user!.id);
  const mentionTargets: string[] = mentions || [];
  const allTargets = new Set([...assigneeTargets, ...mentionTargets]);

  const actor = await User.findById(req.user!.id).select("name");
  const taskUrl = buildTaskUrl(task.workspaceId.toString(), task.projectId.toString(), task._id.toString());

  await Promise.all(
    Array.from(allTargets).map(async (userId) => {
      const isMention = mentionTargets.includes(userId);
      await Notification.create({
        userId,
        type: isMention ? "mention" : "comment",
        title: isMention ? "You were mentioned" : "New comment",
        message: `On task "${task.title}"`,
        relatedProjectId: task.projectId,
        relatedTaskId: task._id,
      });
      req.app.get("io").to(`user:${userId}`).emit("notification:new", { title: isMention ? "You were mentioned" : "New comment" });

      if (isMention) {
        const target = await User.findById(userId).select("email notificationPreferences");
        if (target && target.notificationPreferences?.mentions !== false) {
          const { subject, html } = taskMentionEmail({
            taskTitle: task.title,
            mentionedByName: actor?.name || "Someone",
            commentSnippet: content.slice(0, 140),
            taskUrl,
          });
          sendMail(target.email, subject, html).catch(() => {});
        }
      }
    })
  );

  req.app.get("io").to(`project:${task.projectId}`).emit("comment:created", comment);

  return sendSuccess(res, 201, comment, "Comment added");
});

export const updateComment = catchAsync(async (req: Request, res: Response) => {
  const comment = await Comment.findOneAndUpdate(
    { _id: req.params.commentId, userId: req.user!.id },
    { content: req.body.content },
    { new: true }
  );
  if (!comment) throw ApiError.notFound("Comment not found or not owned by you");
  return sendSuccess(res, 200, comment, "Comment updated");
});

export const deleteComment = catchAsync(async (req: Request, res: Response) => {
  await Comment.findOneAndDelete({ _id: req.params.commentId, userId: req.user!.id });
  return sendSuccess(res, 200, null, "Comment deleted");
});