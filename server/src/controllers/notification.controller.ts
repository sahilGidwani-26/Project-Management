import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { sendPaginated, sendSuccess } from "../utils/ApiResponse";
import { Notification } from "../models/Notification";

export const listNotifications = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const filter = { userId: req.user!.id };

  const [items, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments(filter),
  ]);

  return sendPaginated(res, items, page, limit, total, "Notifications");
});

export const markAsRead = catchAsync(async (req: Request, res: Response) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user!.id }, { isRead: true });
  return sendSuccess(res, 200, null, "Marked as read");
});

export const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
  await Notification.updateMany({ userId: req.user!.id, isRead: false }, { isRead: true });
  return sendSuccess(res, 200, null, "All marked as read");
});

export const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
  return sendSuccess(res, 200, null, "Notification deleted");
});
