import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { Milestone } from "../models/Milestone";
import { Task } from "../models/Task";

export const createMilestone = catchAsync(async (req: Request, res: Response) => {
  const { projectId, title, description, dueDate } = req.body;
  const lastMilestone = await Milestone.findOne({ projectId }).sort({ order: -1 });
  const milestone = await Milestone.create({
    projectId,
    title,
    description,
    dueDate,
    order: (lastMilestone?.order ?? 0) + 1,
  });
  return sendSuccess(res, 201, milestone, "Milestone created");
});

export const listMilestones = catchAsync(async (req: Request, res: Response) => {
  const milestones = await Milestone.find({ projectId: req.params.projectId }).sort({ order: 1 });

  // Attach progress per milestone (tasks completed / total) for the UI.
  const withProgress = await Promise.all(
    milestones.map(async (m) => {
      const [total, completed] = await Promise.all([
        Task.countDocuments({ milestoneId: m._id }),
        Task.countDocuments({ milestoneId: m._id, status: "Done" }),
      ]);
      return { ...m.toObject(), taskStats: { total, completed } };
    })
  );

  return sendSuccess(res, 200, withProgress, "Milestones");
});

export const updateMilestone = catchAsync(async (req: Request, res: Response) => {
  const milestone = await Milestone.findByIdAndUpdate(req.params.milestoneId, req.body, { new: true });
  if (!milestone) throw ApiError.notFound("Milestone not found");
  return sendSuccess(res, 200, milestone, "Milestone updated");
});

export const deleteMilestone = catchAsync(async (req: Request, res: Response) => {
  await Milestone.findByIdAndDelete(req.params.milestoneId);
  await Task.updateMany({ milestoneId: req.params.milestoneId }, { $unset: { milestoneId: "" } });
  return sendSuccess(res, 200, null, "Milestone deleted");
});
