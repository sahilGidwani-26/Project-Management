import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { listComments, addComment, updateComment, deleteComment } from "../controllers/comment.controller";

const router = Router({ mergeParams: true });
router.use(requireAuth);

router.get("/:taskId/comments", listComments);
router.post("/:taskId/comments", addComment);
router.patch("/comments/:commentId", updateComment);
router.delete("/comments/:commentId", deleteComment);

export default router;
