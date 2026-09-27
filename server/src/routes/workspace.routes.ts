import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { loadWorkspaceRole, requireWorkspaceRole } from "../middleware/workspaceRole";
import { validate } from "../middleware/validate";
import { createWorkspaceSchema, inviteMemberSchema } from "../validations/workspace.validation";
import {
  createWorkspace,
  listMyWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  listMembers,
  inviteMember,
  acceptInvitation,
  updateMemberRole,
  removeMember,
} from "../controllers/workspace.controller";

const router = Router();

router.use(requireAuth);

router.post("/", validate(createWorkspaceSchema), createWorkspace);
router.get("/", listMyWorkspaces);
router.post("/invitations/:token/accept", acceptInvitation);

router.get("/:workspaceId", loadWorkspaceRole, getWorkspace);
router.patch("/:workspaceId", loadWorkspaceRole, requireWorkspaceRole("OWNER", "ADMIN"), updateWorkspace);
router.delete("/:workspaceId", loadWorkspaceRole, requireWorkspaceRole("OWNER"), deleteWorkspace);

router.get("/:workspaceId/members", loadWorkspaceRole, listMembers);
router.post(
  "/:workspaceId/invitations",
  loadWorkspaceRole,
  requireWorkspaceRole("OWNER", "ADMIN"),
  validate(inviteMemberSchema),
  inviteMember
);
router.patch("/:workspaceId/members/:memberId", loadWorkspaceRole, requireWorkspaceRole("OWNER", "ADMIN"), updateMemberRole);
router.delete("/:workspaceId/members/:memberId", loadWorkspaceRole, requireWorkspaceRole("OWNER", "ADMIN"), removeMember);

export default router;
