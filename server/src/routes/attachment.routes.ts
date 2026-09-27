import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { uploadAttachment, listAttachments, deleteAttachment } from "../controllers/attachment.controller";

const router = Router();
router.use(requireAuth);

router.post("/", upload.single("file"), uploadAttachment);
router.get("/", listAttachments);
router.delete("/:id", deleteAttachment);

export default router;
