import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { sendSuccess } from "../utils/ApiResponse";
import { Comment } from "../models/Comment";
import { Task } from "../models/Task";
import { Notification } from "../models/Notification";
import { ApiError } from "../utils/ApiError";

export const listComments = catchAsync(async (req: Request, res: Response) => {
  const comments = await Comment.find({ taskId: req.params.taskId })
    .sort({ createdAt: 1 })
    .populate("userId", "name profileImage");
  return sendSuccess(res, 200, comments, "Comments");
});

export const addComment = catchAsync(async (req: Request, res: Response) => {
  const { content, parentCommentId, mentions } = req.body;
  const task = await Task.findById(req.params.taskId);
  if (!task) throw ApiError.notFound("Task not found");

  const comment = await Comment.create({
    taskId: task._id,
    userId: req.user!.id,
    content,
    parentCommentId,
    mentions: mentions || [],
  });

  const notifyTargets = new Set<string>();
  if (task.assigneeId && task.assigneeId.toString() !== req.user!.id) notifyTargets.add(task.assigneeId.toString());
  (mentions || []).forEach((id: string) => notifyTargets.add(id));

  await Promise.all(
    Array.from(notifyTargets).map((userId) =>
      Notification.create({
        userId,
        type: mentions?.includes(userId) ? "mention" : "comment",
        title: mentions?.includes(userId) ? "You were mentioned" : "New comment",
        message: `On task "${task.title}"`,
        relatedProjectId: task.projectId,
        relatedTaskId: task._id,
      })
    )
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
