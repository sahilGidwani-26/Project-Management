import { Request, Response } from "express";
import streamifier from "streamifier";
import cloudinary from "../config/cloudinary";
import { catchAsync } from "../utils/catchAsync";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { Attachment } from "../models/Attachment";

function uploadBufferToCloudinary(buffer: Buffer, folder: string): Promise<{ secure_url: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: "auto" }, (err, result) => {
      if (err || !result) return reject(err);
      resolve(result as { secure_url: string });
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

export const uploadAttachment = catchAsync(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) throw ApiError.badRequest("No file provided");

  const { taskId, projectId, commentId } = req.body;
  if (!taskId && !projectId) throw ApiError.badRequest("taskId or projectId is required");

  const result = await uploadBufferToCloudinary(file.buffer, "pm-saas/attachments");

  const attachment = await Attachment.create({
    taskId,
    projectId,
    commentId,
    uploadedBy: req.user!.id,
    fileName: file.originalname,
    fileUrl: result.secure_url,
    fileType: file.mimetype,
    fileSize: file.size,
  });

  return sendSuccess(res, 201, attachment, "File uploaded");
});

export const listAttachments = catchAsync(async (req: Request, res: Response) => {
  const { taskId, projectId } = req.query;
  const filter: Record<string, unknown> = {};
  if (taskId) filter.taskId = taskId;
  if (projectId) filter.projectId = projectId;

  const attachments = await Attachment.find(filter).sort({ createdAt: -1 }).populate("uploadedBy", "name profileImage");
  return sendSuccess(res, 200, attachments, "Attachments");
});

export const deleteAttachment = catchAsync(async (req: Request, res: Response) => {
  const attachment = await Attachment.findOneAndDelete({ _id: req.params.id, uploadedBy: req.user!.id });
  if (!attachment) throw ApiError.notFound("Attachment not found or not owned by you");
  return sendSuccess(res, 200, null, "Attachment deleted");
});
