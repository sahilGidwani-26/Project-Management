import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { workspaceAnalytics, projectAnalytics, teamWorkload, projectHealth, activityTimeline } from "../controllers/analytics.controller";

const router = Router();
router.use(requireAuth);

router.get("/workspace/:workspaceId", workspaceAnalytics);
router.get("/workspace/:workspaceId/workload", teamWorkload);
router.get("/workspace/:workspaceId/activity", activityTimeline);
router.get("/project/:projectId", projectAnalytics);
router.get("/project/:projectId/health", projectHealth);

export default router;
