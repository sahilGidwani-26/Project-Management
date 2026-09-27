import { Router } from "express";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  changePasswordSchema,
  googleAuthSchema,
  notificationPreferencesSchema,
} from "../validations/auth.validation";
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  verifyEmail,
  changePassword,
  googleAuth,
  updateNotificationPreferences,
} from "../controllers/auth.controller";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);
router.get("/me", requireAuth, getMe);
router.patch("/me", requireAuth, updateProfile);
router.post("/verify-email", validate(verifyEmailSchema), verifyEmail);
router.post("/change-password", requireAuth, validate(changePasswordSchema), changePassword);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);
router.post("/google", validate(googleAuthSchema), googleAuth);
router.patch(
  "/notification-preferences",
  requireAuth,
  validate(notificationPreferencesSchema),
  updateNotificationPreferences
);

export default router;
