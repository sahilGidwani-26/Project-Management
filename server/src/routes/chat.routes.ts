import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createChannelSchema, sendMessageSchema } from "../validations/chat.validation";
import {
  createChannel,
  listChannels,
  getOrCreateDM,
  joinChannel,
  listMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  addReaction,
} from "../controllers/chat.controller";

const router = Router();
router.use(requireAuth);

router.post("/channels", validate(createChannelSchema), createChannel);
router.get("/channels/workspace/:workspaceId", listChannels);
router.post("/channels/workspace/:workspaceId/dm", getOrCreateDM);
router.post("/channels/:channelId/join", joinChannel);

router.get("/channels/:channelId/messages", listMessages);
router.post("/channels/:channelId/messages", validate(sendMessageSchema), sendMessage);
router.patch("/messages/:messageId", editMessage);
router.delete("/messages/:messageId", deleteMessage);
router.post("/messages/:messageId/reactions", addReaction);

export default router;
