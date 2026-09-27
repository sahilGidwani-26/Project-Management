import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { sendSuccess } from "../utils/ApiResponse";
import { Project } from "../models/Project";
import { Task } from "../models/Task";
import { WorkspaceMember } from "../models/WorkspaceMember";
import { Comment } from "../models/Comment";
import { Label } from "../models/Label";

/** Global search across projects, tasks, members, comments and labels within a workspace. */
export const globalSearch = catchAsync(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const q = (req.query.q as string) || "";
  if (!q.trim()) return sendSuccess(res, 200, { projects: [], tasks: [], members: [], comments: [], labels: [] }, "Search");

  const regex = { $regex: q, $options: "i" };

  const [projects, tasks, members, labels] = await Promise.all([
    Project.find({ workspaceId, name: regex }).limit(10).select("name slug status"),
    Task.find({ workspaceId, $or: [{ title: regex }, { description: regex }] }).limit(10).select("title status projectId"),
    WorkspaceMember.find({ workspaceId, status: "active" })
      .populate({ path: "userId", match: { name: regex }, select: "name email profileImage" })
      .limit(30)
      .then((rows) => rows.filter((r) => r.userId).slice(0, 10)),
    Label.find({ workspaceId, name: regex }).limit(10),
  ]);

  const taskIds = await Task.find({ workspaceId }).distinct("_id");
  const comments = await Comment.find({ taskId: { $in: taskIds }, content: regex })
    .limit(10)
    .populate("userId", "name profileImage");

  return sendSuccess(res, 200, { projects, tasks, members, comments, labels }, "Search results");
});
