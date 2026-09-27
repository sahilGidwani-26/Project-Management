import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { Label } from "../models/Label";
import { Task } from "../models/Task";

export const createLabel = catchAsync(async (req: Request, res: Response) => {
  const { workspaceId, name, color } = req.body;
  const existing = await Label.findOne({ workspaceId, name });
  if (existing) throw ApiError.conflict("A label with this name already exists");

  const label = await Label.create({ workspaceId, name, color, createdBy: req.user!.id });
  return sendSuccess(res, 201, label, "Label created");
});

export const listLabels = catchAsync(async (req: Request, res: Response) => {
  const labels = await Label.find({ workspaceId: req.params.workspaceId }).sort({ name: 1 });
  return sendSuccess(res, 200, labels, "Labels");
});

export const updateLabel = catchAsync(async (req: Request, res: Response) => {
  const label = await Label.findByIdAndUpdate(req.params.labelId, req.body, { new: true });
  if (!label) throw ApiError.notFound("Label not found");
  return sendSuccess(res, 200, label, "Label updated");
});

export const deleteLabel = catchAsync(async (req: Request, res: Response) => {
  const label = await Label.findByIdAndDelete(req.params.labelId);
  if (!label) throw ApiError.notFound("Label not found");
  // Remove the label from any tasks that reference it by name.
  await Task.updateMany({ workspaceId: label.workspaceId, labels: label.name }, { $pull: { labels: label.name } });
  return sendSuccess(res, 200, null, "Label deleted");
});
