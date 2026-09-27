import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { globalSearch } from "../controllers/search.controller";

const router = Router();
router.use(requireAuth);

router.get("/workspace/:workspaceId", globalSearch);

export default router;
