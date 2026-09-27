import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { createSavedView, listSavedViews, deleteSavedView } from "../controllers/savedView.controller";

const router = Router();
router.use(requireAuth);

router.post("/", createSavedView);
router.get("/", listSavedViews);
router.delete("/:viewId", deleteSavedView);

export default router;
