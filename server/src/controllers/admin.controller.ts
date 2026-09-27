import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { sendPaginated, sendSuccess } from "../utils/ApiResponse";
import { User } from "../models/User";
import { Workspace } from "../models/Workspace";
import { Project } from "../models/Project";
import { Task } from "../models/Task";
import { ActivityLog } from "../models/ActivityLog";
import { WorkspaceMember } from "../models/WorkspaceMember";
import { ApiError } from "../utils/ApiError";

export const adminOverview = catchAsync(async (_req: Request, res: Response) => {
  const [totalUsers, totalWorkspaces, totalProjects, totalTasks, tasksCompleted] = await Promise.all([
    User.countDocuments(),
    Workspace.countDocuments(),
    Project.countDocuments(),
    Task.countDocuments(),
    Task.countDocuments({ status: "Done" }),
  ]);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const newUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

  return sendSuccess(
    res,
    200,
    { totalUsers, newUsers, totalWorkspaces, totalProjects, totalTasks, tasksCompleted },
    "Admin overview"
  );
});

export const listAllUsers = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const search = (req.query.search as string) || "";

  const filter = search ? { $or: [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }] } : {};

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);

  return sendPaginated(res, items, page, limit, total, "Users");
});

export const suspendUser = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(req.params.userId, { accountStatus: "suspended" }, { new: true });
  if (!user) throw ApiError.notFound("User not found");
  return sendSuccess(res, 200, user, "User suspended");
});

export const reactivateUser = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(req.params.userId, { accountStatus: "active" }, { new: true });
  return sendSuccess(res, 200, user, "User reactivated");
});

export const listAllWorkspaces = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const [items, total] = await Promise.all([
    Workspace.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Workspace.countDocuments(),
  ]);

  return sendPaginated(res, items, page, limit, total, "Workspaces");
});

export const getWorkspaceDetail = catchAsync(async (req: Request, res: Response) => {
  const workspace = await Workspace.findById(req.params.workspaceId);
  if (!workspace) throw ApiError.notFound("Workspace not found");

  const [members, projects, recentActivity] = await Promise.all([
    WorkspaceMember.find({ workspaceId: workspace._id, status: "active" }).populate("userId", "name email profileImage"),
    Project.find({ workspaceId: workspace._id }).select("name status priority createdAt"),
    ActivityLog.find({ workspaceId: workspace._id }).sort({ createdAt: -1 }).limit(20).populate("actorId", "name email"),
  ]);

  return sendSuccess(res, 200, { workspace, members, projects, recentActivity }, "Workspace detail");
});

export const suspendWorkspace = catchAsync(async (req: Request, res: Response) => {
  const workspace = await Workspace.findByIdAndUpdate(req.params.workspaceId, { status: "suspended" }, { new: true });
  if (!workspace) throw ApiError.notFound("Workspace not found");
  await ActivityLog.create({
    workspaceId: workspace._id,
    actorId: req.user!.id,
    action: "workspace_suspended",
    resourceType: "Workspace",
    resourceId: workspace._id,
  });
  return sendSuccess(res, 200, workspace, "Workspace suspended");
});

export const reactivateWorkspace = catchAsync(async (req: Request, res: Response) => {
  const workspace = await Workspace.findByIdAndUpdate(req.params.workspaceId, { status: "active" }, { new: true });
  if (!workspace) throw ApiError.notFound("Workspace not found");
  return sendSuccess(res, 200, workspace, "Workspace reactivated");
});

export const auditLogs = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 30;

  const [items, total] = await Promise.all([
    ActivityLog.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("actorId", "name email"),
    ActivityLog.countDocuments(),
  ]);

  return sendPaginated(res, items, page, limit, total, "Audit logs");
});
