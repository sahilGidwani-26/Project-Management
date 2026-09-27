import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { createMilestone, listMilestones, updateMilestone, deleteMilestone } from "../controllers/milestone.controller";

const router = Router();
router.use(requireAuth);

router.post("/", createMilestone);
router.get("/project/:projectId", listMilestones);
router.patch("/:milestoneId", updateMilestone);
router.delete("/:milestoneId", deleteMilestone);

export default router;
