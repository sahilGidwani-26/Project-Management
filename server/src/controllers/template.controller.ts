import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { ProjectTemplate } from "../models/ProjectTemplate";
import { Project } from "../models/Project";
import { Milestone } from "../models/Milestone";
import { Task } from "../models/Task";

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export const createTemplate = catchAsync(async (req: Request, res: Response) => {
  const { workspaceId, name, description, milestones, tasks } = req.body;
  const template = await ProjectTemplate.create({
    workspaceId,
    name,
    description,
    milestones,
    tasks,
    createdBy: req.user!.id,
  });
  return sendSuccess(res, 201, template, "Template created");
});

export const listTemplates = catchAsync(async (req: Request, res: Response) => {
  const templates = await ProjectTemplate.find({ workspaceId: req.params.workspaceId }).sort({ createdAt: -1 });
  return sendSuccess(res, 200, templates, "Templates");
});

export const deleteTemplate = catchAsync(async (req: Request, res: Response) => {
  await ProjectTemplate.findByIdAndDelete(req.params.templateId);
  return sendSuccess(res, 200, null, "Template deleted");
});

/** Creates a real project + its milestones + its tasks from a saved template. */
export const createProjectFromTemplate = catchAsync(async (req: Request, res: Response) => {
  const { templateId } = req.params;
  const { name, workspaceId } = req.body;

  const template = await ProjectTemplate.findById(templateId);
  if (!template) throw ApiError.notFound("Template not found");

  const project = await Project.create({
    workspaceId,
    name: name || template.name,
    slug: `${slugify(name || template.name)}-${Date.now().toString(36)}`,
    description: template.description,
    createdBy: req.user!.id,
  });

  const milestoneMap = new Map<string, string>();
  for (const [index, title] of template.milestones.entries()) {
    const milestone = await Milestone.create({ projectId: project._id, title, order: index + 1 });
    milestoneMap.set(title, milestone._id.toString());
  }

  for (const t of template.tasks) {
    await Task.create({
      workspaceId,
      projectId: project._id,
      title: t.title,
      description: t.description,
      estimatedMinutes: t.estimatedMinutes,
      milestoneId: t.milestoneTitle ? milestoneMap.get(t.milestoneTitle) : undefined,
      reporterId: req.user!.id,
      createdBy: req.user!.id,
      status: "Todo",
    });
  }

  return sendSuccess(res, 201, project, "Project created from template");
});
