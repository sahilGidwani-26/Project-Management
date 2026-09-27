import { Router } from "express";
import { requireAuth, requireSuperAdmin } from "../middleware/auth";
import {
  adminOverview,
  listAllUsers,
  suspendUser,
  reactivateUser,
  listAllWorkspaces,
  getWorkspaceDetail,
  suspendWorkspace,
  reactivateWorkspace,
  auditLogs,
} from "../controllers/admin.controller";

const router = Router();
router.use(requireAuth, requireSuperAdmin);

router.get("/dashboard", adminOverview);
router.get("/users", listAllUsers);
router.patch("/users/:userId/suspend", suspendUser);
router.patch("/users/:userId/reactivate", reactivateUser);
router.get("/workspaces", listAllWorkspaces);
router.get("/workspaces/:workspaceId", getWorkspaceDetail);
router.patch("/workspaces/:workspaceId/suspend", suspendWorkspace);
router.patch("/workspaces/:workspaceId/reactivate", reactivateWorkspace);
router.get("/audit-logs", auditLogs);

export default router;
