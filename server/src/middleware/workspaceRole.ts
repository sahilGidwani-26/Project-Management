import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { catchAsync } from "../utils/catchAsync";
import { WorkspaceMember, WorkspaceRole } from "../models/WorkspaceMember";

/**
 * Loads the requester's role for req.params.workspaceId (or req.body.workspaceId)
 * and attaches it to req.workspaceRole. Backend is the source of truth for
 * permissions -- frontend checks are UX only.
 */
export const loadWorkspaceRole = catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
  const workspaceId = req.params.workspaceId || req.body.workspaceId;
  if (!workspaceId) throw ApiError.badRequest("workspaceId is required");

  const member = await WorkspaceMember.findOne({
    workspaceId,
    userId: req.user!.id,
    status: "active",
  });

  if (!member) throw ApiError.forbidden("You are not a member of this workspace");

  req.workspaceRole = member.role;
  next();
});

export function requireWorkspaceRole(...allowed: WorkspaceRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.workspaceRole || !allowed.includes(req.workspaceRole as WorkspaceRole)) {
      return next(ApiError.forbidden("You do not have permission to perform this action"));
    }
    next();
  };
}
