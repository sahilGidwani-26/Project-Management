import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { ApiError } from "../utils/ApiError";
import { sendSuccess, sendPaginated } from "../utils/ApiResponse";
import { Project } from "../models/Project";
import { Task } from "../models/Task";
import { ActivityLog } from "../models/ActivityLog";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const createProject = catchAsync(async (req: Request, res: Response) => {
  const { workspaceId, name, description, managerId, startDate, endDate, priority, color } = req.body;

  const project = await Project.create({
    workspaceId,
    name,
    slug: `${slugify(name)}-${Date.now().toString(36)}`,
    description,
    managerId,
    startDate,
    endDate,
    priority,
    color,
    createdBy: req.user!.id,
    members: managerId ? [managerId] : [],
  });

  await ActivityLog.create({
    workspaceId,
    actorId: req.user!.id,
    action: "project_created",
    resourceType: "Project",
    resourceId: project._id,
    metadata: { name },
  });

  return sendSuccess(res, 201, project, "Project created");
});

export const listProjects = catchAsync(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const search = (req.query.search as string) || "";
  const status = req.query.status as string | undefined;

  const filter: Record<string, unknown> = { workspaceId };
  if (search) filter.name = { $regex: search, $options: "i" };
  if (status) filter.status = status;

  const [items, total] = await Promise.all([
    Project.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("managerId", "name profileImage"),
    Project.countDocuments(filter),
  ]);

  return sendPaginated(res, items, page, limit, total, "Projects");
});

export const getProject = catchAsync(async (req: Request, res: Response) => {
  const project = await Project.findById(req.params.projectId)
    .populate("managerId", "name profileImage email")
    .populate("members", "name profileImage email");
  if (!project) throw ApiError.notFound("Project not found");

  const [total, completed, inProgress, overdue] = await Promise.all([
    Task.countDocuments({ projectId: project._id }),
    Task.countDocuments({ projectId: project._id, status: "Done" }),
    Task.countDocuments({ projectId: project._id, status: "In Progress" }),
    Task.countDocuments({ projectId: project._id, dueDate: { $lt: new Date() }, status: { $ne: "Done" } }),
  ]);

  return sendSuccess(
    res,
    200,
    { project, stats: { total, completed, inProgress, overdue, pending: total - completed - inProgress } },
    "Project"
  );
});

export const updateProject = catchAsync(async (req: Request, res: Response) => {
  const project = await Project.findByIdAndUpdate(req.params.projectId, req.body, { new: true });
  if (!project) throw ApiError.notFound("Project not found");
  return sendSuccess(res, 200, project, "Project updated");
});

export const archiveProject = catchAsync(async (req: Request, res: Response) => {
  const project = await Project.findByIdAndUpdate(req.params.projectId, { status: "Archived" }, { new: true });
  if (!project) throw ApiError.notFound("Project not found");
  return sendSuccess(res, 200, project, "Project archived");
});

export const deleteProject = catchAsync(async (req: Request, res: Response) => {
  await Project.findByIdAndDelete(req.params.projectId);
  await Task.deleteMany({ projectId: req.params.projectId });
  return sendSuccess(res, 200, null, "Project deleted");
});
