import { Response } from "express";

export function sendSuccess(res: Response, statusCode: number, data: unknown, message = "Success") {
  return res.status(statusCode).json({ success: true, message, data });
}

export function sendPaginated(
  res: Response,
  items: unknown[],
  page: number,
  limit: number,
  total: number,
  message = "Success"
) {
  return res.status(200).json({
    success: true,
    message,
    data: items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
}
