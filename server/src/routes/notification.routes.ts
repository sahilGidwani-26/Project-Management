import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { listNotifications, markAsRead, markAllAsRead, deleteNotification } from "../controllers/notification.controller";

const router = Router();
router.use(requireAuth);

router.get("/", listNotifications);
router.patch("/:id/read", markAsRead);
router.patch("/read-all", markAllAsRead);
router.delete("/:id", deleteNotification);

export default router;
