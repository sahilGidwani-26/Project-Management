import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { sendSuccess } from "../utils/ApiResponse";
import { Task } from "../models/Task";
import { Project } from "../models/Project";
import { WorkspaceMember } from "../models/WorkspaceMember";
import { ActivityLog } from "../models/ActivityLog";
import { Types } from "mongoose";

/** Resolves the `range` query param (today | 7d | 30d | 3m | custom via from/to) into a createdAt filter. */
function resolveDateFilter(req: Request): Record<string, unknown> {
  const { range, from, to } = req.query as Record<string, string>;
  const now = new Date();

  if (range === "today") return { $gte: new Date(now.setHours(0, 0, 0, 0)) };
  if (range === "7d") return { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
  if (range === "30d") return { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
  if (range === "3m") return { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) };
  if (from || to) {
    const filter: Record<string, Date> = {};
    if (from) filter.$gte = new Date(from);
    if (to) filter.$lte = new Date(to);
    return filter;
  }
  return {}; // all time
}

export const workspaceAnalytics = catchAsync(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const wid = new Types.ObjectId(workspaceId);
  const dateFilter = resolveDateFilter(req);
  const createdAtFilter = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

  const [totalProjects, activeProjects, completedProjects, taskStats, teamCount] = await Promise.all([
    Project.countDocuments({ workspaceId: wid, ...createdAtFilter }),
    Project.countDocuments({ workspaceId: wid, status: "Active" }),
    Project.countDocuments({ workspaceId: wid, status: "Completed" }),
    Task.aggregate([
      { $match: { workspaceId: wid, ...createdAtFilter } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    WorkspaceMember.countDocuments({ workspaceId: wid, status: "active" }),
  ]);

  const overdue = await Task.countDocuments({
    workspaceId: wid,
    dueDate: { $lt: new Date() },
    status: { $ne: "Done" },
  });

  return sendSuccess(
    res,
    200,
    {
      totalProjects,
      activeProjects,
      completedProjects,
      teamMembers: teamCount,
      overdueTasks: overdue,
      tasksByStatus: taskStats,
    },
    "Workspace analytics"
  );
});

/**
 * Transparent project-health check (no unexplained score).
 * Returns a state (ON_TRACK / NEEDS_ATTENTION / AT_RISK) plus the concrete
 * reasons behind it, exactly as specced.
 */
export const projectHealth = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const pid = new Types.ObjectId(projectId);
  const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const [overdueTasks, dueSoonTasks, blockedTasks, unassignedTasks] = await Promise.all([
    Task.countDocuments({ projectId: pid, dueDate: { $lt: new Date() }, status: { $ne: "Done" } }),
    Task.countDocuments({ projectId: pid, dueDate: { $gte: new Date(), $lte: in24h }, status: { $ne: "Done" } }),
    Task.countDocuments({ projectId: pid, status: "In Review", dependencies: { $exists: true, $not: { $size: 0 } } }),
    Task.countDocuments({ projectId: pid, assigneeIds: { $size: 0 }, status: { $ne: "Done" } }),
  ]);

  const reasons: string[] = [];
  if (overdueTasks > 0) reasons.push(`${overdueTasks} overdue task${overdueTasks > 1 ? "s" : ""}`);
  if (dueSoonTasks > 0) reasons.push(`${dueSoonTasks} deadline${dueSoonTasks > 1 ? "s" : ""} within 24 hours`);
  if (blockedTasks > 0) reasons.push(`${blockedTasks} blocked task${blockedTasks > 1 ? "s" : ""}`);
  if (unassignedTasks > 0) reasons.push(`${unassignedTasks} unassigned task${unassignedTasks > 1 ? "s" : ""}`);

  let state: "ON_TRACK" | "NEEDS_ATTENTION" | "AT_RISK" = "ON_TRACK";
  if (overdueTasks >= 3 || blockedTasks >= 1 || dueSoonTasks >= 2) state = "AT_RISK";
  else if (overdueTasks > 0 || dueSoonTasks > 0 || unassignedTasks > 2) state = "NEEDS_ATTENTION";

  return sendSuccess(
    res,
    200,
    { state, reasons, metrics: { overdueTasks, dueSoonTasks, blockedTasks, unassignedTasks } },
    "Project health"
  );
});

export const activityTimeline = catchAsync(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const { projectId } = req.query as Record<string, string>;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 30;

  const filter: Record<string, unknown> = { workspaceId };
  if (projectId) filter.resourceId = projectId;

  const [items, total] = await Promise.all([
    ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("actorId", "name profileImage"),
    ActivityLog.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, { items, page, limit, total }, "Activity timeline");
});

export const projectAnalytics = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const pid = new Types.ObjectId(projectId);

  const [byStatus, byPriority, overdue] = await Promise.all([
    Task.aggregate([{ $match: { projectId: pid } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Task.aggregate([{ $match: { projectId: pid } }, { $group: { _id: "$priority", count: { $sum: 1 } } }]),
    Task.countDocuments({ projectId: pid, dueDate: { $lt: new Date() }, status: { $ne: "Done" } }),
  ]);

  return sendSuccess(res, 200, { byStatus, byPriority, overdueTasks: overdue }, "Project analytics");
});

export const teamWorkload = catchAsync(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const wid = new Types.ObjectId(workspaceId);

  const workload = await Task.aggregate([
    { $match: { workspaceId: wid, status: { $ne: "Done" }, assigneeIds: { $exists: true, $not: { $size: 0 } } } },
    { $unwind: "$assigneeIds" },
    {
      $group: {
        _id: "$assigneeIds",
        assignedTasks: { $sum: 1 },
        estimatedMinutes: { $sum: { $ifNull: ["$estimatedMinutes", 0] } },
      },
    },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    {
      $project: {
        assignedTasks: 1,
        estimatedMinutes: 1,
        "user.name": 1,
        "user.profileImage": 1,
      },
    },
  ]);

  return sendSuccess(res, 200, workload, "Team workload");
});