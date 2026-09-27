import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { TimeEntry } from "../models/TimeEntry";
import { Task } from "../models/Task";

export const startTimer = catchAsync(async (req: Request, res: Response) => {
  const { taskId } = req.body;

  const running = await TimeEntry.findOne({ userId: req.user!.id, endTime: { $exists: false } });
  if (running) throw ApiError.conflict("You already have a running timer. Stop it before starting a new one.");

  const entry = await TimeEntry.create({ userId: req.user!.id, taskId, startTime: new Date() });
  return sendSuccess(res, 201, entry, "Timer started");
});

export const stopTimer = catchAsync(async (req: Request, res: Response) => {
  const entry = await TimeEntry.findOne({ _id: req.params.entryId, userId: req.user!.id, endTime: { $exists: false } });
  if (!entry) throw ApiError.notFound("Running timer not found");

  entry.endTime = new Date();
  entry.durationMinutes = Math.round((entry.endTime.getTime() - entry.startTime.getTime()) / 60000);
  await entry.save();

  await Task.findByIdAndUpdate(entry.taskId, { $inc: { actualMinutes: entry.durationMinutes } });

  return sendSuccess(res, 200, entry, "Timer stopped");
});

export const getRunningTimer = catchAsync(async (req: Request, res: Response) => {
  const entry = await TimeEntry.findOne({ userId: req.user!.id, endTime: { $exists: false } });
  return sendSuccess(res, 200, entry, "Running timer");
});

export const listTimeEntries = catchAsync(async (req: Request, res: Response) => {
  const { taskId, userId } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};
  if (taskId) filter.taskId = taskId;
  if (userId) filter.userId = userId;

  const entries = await TimeEntry.find(filter).sort({ startTime: -1 }).populate("userId", "name profileImage");
  return sendSuccess(res, 200, entries, "Time entries");
});
