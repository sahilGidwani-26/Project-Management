import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { SavedView } from "../models/SavedView";

export const createSavedView = catchAsync(async (req: Request, res: Response) => {
  const view = await SavedView.create({ ...req.body, userId: req.user!.id });
  return sendSuccess(res, 201, view, "View saved");
});

export const listSavedViews = catchAsync(async (req: Request, res: Response) => {
  const { workspaceId, projectId } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = { userId: req.user!.id };
  if (workspaceId) filter.workspaceId = workspaceId;
  if (projectId) filter.projectId = projectId;

  const views = await SavedView.find(filter).sort({ createdAt: -1 });
  return sendSuccess(res, 200, views, "Saved views");
});

export const deleteSavedView = catchAsync(async (req: Request, res: Response) => {
  const view = await SavedView.findOneAndDelete({ _id: req.params.viewId, userId: req.user!.id });
  if (!view) throw ApiError.notFound("Saved view not found");
  return sendSuccess(res, 200, null, "Saved view deleted");
});
