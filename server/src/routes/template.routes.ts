import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  createTemplate,
  listTemplates,
  deleteTemplate,
  createProjectFromTemplate,
} from "../controllers/template.controller";

const router = Router();
router.use(requireAuth);

router.post("/", createTemplate);
router.get("/workspace/:workspaceId", listTemplates);
router.delete("/:templateId", deleteTemplate);
router.post("/:templateId/create-project", createProjectFromTemplate);

export default router;
