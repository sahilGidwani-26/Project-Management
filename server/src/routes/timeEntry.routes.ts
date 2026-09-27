import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { startTimer, stopTimer, getRunningTimer, listTimeEntries } from "../controllers/timeEntry.controller";

const router = Router();
router.use(requireAuth);

router.post("/start", startTimer);
router.patch("/:entryId/stop", stopTimer);
router.get("/running", getRunningTimer);
router.get("/", listTimeEntries);

export default router;
