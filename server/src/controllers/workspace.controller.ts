import { Request, Response } from "express";
import crypto from "crypto";
import { catchAsync } from "../utils/catchAsync";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { Workspace } from "../models/Workspace";
import { WorkspaceMember } from "../models/WorkspaceMember";
import { Invitation } from "../models/Invitation";
import { Channel } from "../models/Channel";
import { sendMail } from "../utils/mailer";
import { env } from "../config/env";

export const createWorkspace = catchAsync(async (req: Request, res: Response) => {
  const { name, description, slug, logo } = req.body;
  const userId = req.user!.id;

  const slugTaken = await Workspace.findOne({ slug });
  if (slugTaken) throw ApiError.conflict("This workspace slug is already taken");

  const workspace = await Workspace.create({ name, description, slug, logo, ownerId: userId });
  await WorkspaceMember.create({ workspaceId: workspace._id, userId, role: "OWNER" });

  // Every workspace gets a default #general chat channel, like Slack.
  await Channel.create({
    workspaceId: workspace._id,
    type: "channel",
    name: "general",
    description: "Workspace-wide announcements and chat",
    members: [userId],
    createdBy: userId,
  });

  return sendSuccess(res, 201, workspace, "Workspace created");
});

export const listMyWorkspaces = catchAsync(async (req: Request, res: Response) => {
  const memberships = await WorkspaceMember.find({ userId: req.user!.id, status: "active" }).populate("workspaceId");
  const workspaces = memberships.map((m) => {
    const ws = m.workspaceId as unknown as { toObject?: () => Record<string, unknown> };
    return { ...(ws.toObject ? ws.toObject() : ws), myRole: m.role };
  });
  return sendSuccess(res, 200, workspaces, "Workspaces");
});

export const getWorkspace = catchAsync(async (req: Request, res: Response) => {
  const workspace = await Workspace.findById(req.params.workspaceId);
  if (!workspace) throw ApiError.notFound("Workspace not found");
  return sendSuccess(res, 200, workspace, "Workspace");
});

export const updateWorkspace = catchAsync(async (req: Request, res: Response) => {
  const workspace = await Workspace.findByIdAndUpdate(req.params.workspaceId, req.body, { new: true });
  if (!workspace) throw ApiError.notFound("Workspace not found");
  return sendSuccess(res, 200, workspace, "Workspace updated");
});

export const deleteWorkspace = catchAsync(async (req: Request, res: Response) => {
  await Workspace.findByIdAndDelete(req.params.workspaceId);
  return sendSuccess(res, 200, null, "Workspace deleted");
});

export const listMembers = catchAsync(async (req: Request, res: Response) => {
  const members = await WorkspaceMember.find({ workspaceId: req.params.workspaceId, status: "active" }).populate(
    "userId",
    "name email profileImage jobTitle"
  );
  return sendSuccess(res, 200, members, "Members");
});

export const inviteMember = catchAsync(async (req: Request, res: Response) => {
  const { email, role } = req.body;
  const workspaceId = req.params.workspaceId;

  const token = crypto.randomBytes(24).toString("hex");
  const invitation = await Invitation.create({
    workspaceId,
    email,
    role,
    token,
    invitedBy: req.user!.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const inviteUrl = `${env.CLIENT_URL}/invitations/${token}`;
  sendMail(email, "You're invited to a workspace", `<p>Join here: <a href="${inviteUrl}">${inviteUrl}</a></p>`).catch(
    () => {}
  );

  return sendSuccess(res, 201, invitation, "Invitation sent");
});

export const acceptInvitation = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.params;
  const invitation = await Invitation.findOne({ token, status: "pending" });
  if (!invitation) throw ApiError.notFound("Invitation not found or already used");
  if (invitation.expiresAt < new Date()) {
    invitation.status = "expired";
    await invitation.save();
    throw ApiError.badRequest("This invitation has expired");
  }

  const existingMember = await WorkspaceMember.findOne({
    workspaceId: invitation.workspaceId,
    userId: req.user!.id,
  });
  if (!existingMember) {
    await WorkspaceMember.create({
      workspaceId: invitation.workspaceId,
      userId: req.user!.id,
      role: invitation.role,
    });
    // Auto-join the default #general channel.
    await Channel.updateOne(
      { workspaceId: invitation.workspaceId, name: "general" },
      { $addToSet: { members: req.user!.id } }
    );
  }

  invitation.status = "accepted";
  await invitation.save();

  return sendSuccess(res, 200, { workspaceId: invitation.workspaceId }, "Invitation accepted");
});

export const updateMemberRole = catchAsync(async (req: Request, res: Response) => {
  const { workspaceId, memberId } = req.params;
  const { role } = req.body;
  const member = await WorkspaceMember.findOneAndUpdate({ workspaceId, _id: memberId }, { role }, { new: true });
  if (!member) throw ApiError.notFound("Member not found");
  return sendSuccess(res, 200, member, "Role updated");
});

export const removeMember = catchAsync(async (req: Request, res: Response) => {
  const { workspaceId, memberId } = req.params;
  await WorkspaceMember.findOneAndUpdate({ workspaceId, _id: memberId }, { status: "removed" });
  return sendSuccess(res, 200, null, "Member removed");
});
