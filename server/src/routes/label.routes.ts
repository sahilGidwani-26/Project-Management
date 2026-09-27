import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { createLabel, listLabels, updateLabel, deleteLabel } from "../controllers/label.controller";

const router = Router();
router.use(requireAuth);

router.post("/", createLabel);
router.get("/workspace/:workspaceId", listLabels);
router.patch("/:labelId", updateLabel);
router.delete("/:labelId", deleteLabel);

export default router;
