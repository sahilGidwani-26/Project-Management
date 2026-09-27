import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { loadWorkspaceRole, requireWorkspaceRole } from "../middleware/workspaceRole";
import { validate } from "../middleware/validate";
import { createProjectSchema } from "../validations/project.validation";
import {
  createProject,
  listProjects,
  getProject,
  updateProject,
  archiveProject,
  deleteProject,
} from "../controllers/project.controller";

const router = Router();
router.use(requireAuth);

router.post(
  "/",
  validate(createProjectSchema),
  loadWorkspaceRole,
  requireWorkspaceRole("OWNER", "ADMIN", "PROJECT_MANAGER"),
  createProject
);
router.get("/workspace/:workspaceId", loadWorkspaceRole, listProjects);
router.get("/:projectId", getProject);
router.patch("/:projectId", updateProject);
router.post("/:projectId/archive", archiveProject);
router.delete("/:projectId", deleteProject);

export default router;
