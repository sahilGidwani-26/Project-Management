import { Router } from "express";
import authRoutes from "./auth.routes";
import workspaceRoutes from "./workspace.routes";
import projectRoutes from "./project.routes";
import taskRoutes from "./task.routes";
import commentRoutes from "./comment.routes";
import notificationRoutes from "./notification.routes";
import chatRoutes from "./chat.routes";
import analyticsRoutes from "./analytics.routes";
import adminRoutes from "./admin.routes";
import labelRoutes from "./label.routes";
import milestoneRoutes from "./milestone.routes";
import timeEntryRoutes from "./timeEntry.routes";
import attachmentRoutes from "./attachment.routes";
import templateRoutes from "./template.routes";
import savedViewRoutes from "./savedView.routes";
import searchRoutes from "./search.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/workspaces", workspaceRoutes);
router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);
router.use("/tasks", commentRoutes); // -> /api/tasks/:taskId/comments
router.use("/notifications", notificationRoutes);
router.use("/chat", chatRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/admin", adminRoutes);
router.use("/labels", labelRoutes);
router.use("/milestones", milestoneRoutes);
router.use("/time-entries", timeEntryRoutes);
router.use("/attachments", attachmentRoutes);
router.use("/templates", templateRoutes);
router.use("/saved-views", savedViewRoutes);
router.use("/search", searchRoutes);

router.get("/health", (_req, res) => res.json({ success: true, message: "API is healthy" }));

export default router;
