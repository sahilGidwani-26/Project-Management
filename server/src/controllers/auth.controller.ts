import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { catchAsync } from "../utils/catchAsync";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { User } from "../models/User";
import { signToken, setAuthCookie, clearAuthCookie } from "../utils/token";
import { sendMail } from "../utils/mailer";
import { generateRawToken, hashToken } from "../utils/crypto";
import { env } from "../config/env";

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export const register = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, emailVerified: false });

  const rawToken = generateRawToken();
  user.emailVerificationTokenHash = hashToken(rawToken);
  await user.save();

  const token = signToken(user._id.toString());
  setAuthCookie(res, token);

  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${rawToken}`;
  sendMail(email, "Verify your email", `<p>Welcome, ${name}! Verify your email: <a href="${verifyUrl}">${verifyUrl}</a></p>`).catch(
    () => {}
  );

  return sendSuccess(
    res,
    201,
    { user: { id: user._id, name: user.name, email: user.email }, token },
    "Registered successfully"
  );
});

export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.body;
  const tokenHash = hashToken(token);
  const user = await User.findOne({ emailVerificationTokenHash: tokenHash }).select("+emailVerificationTokenHash");
  if (!user) throw ApiError.badRequest("Invalid or expired verification token");

  user.emailVerified = true;
  user.emailVerificationTokenHash = undefined;
  await user.save();

  return sendSuccess(res, 200, null, "Email verified successfully");
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !user.passwordHash) throw ApiError.unauthorized("Invalid email or password");
  if (user.accountStatus === "suspended") throw ApiError.forbidden("Account suspended");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized("Invalid email or password");

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(user._id.toString());
  setAuthCookie(res, token);

  return sendSuccess(
    res,
    200,
    { user: { id: user._id, name: user.name, email: user.email, profileImage: user.profileImage }, token },
    "Logged in successfully"
  );
});

export const logout = catchAsync(async (_req: Request, res: Response) => {
  clearAuthCookie(res);
  return sendSuccess(res, 200, null, "Logged out");
});

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw ApiError.notFound("User not found");
  return sendSuccess(res, 200, user, "Current user");
});

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const { name, jobTitle, bio, timezone, profileImage } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user!.id,
    { ...(name && { name }), jobTitle, bio, timezone, ...(profileImage && { profileImage }) },
    { new: true }
  );
  return sendSuccess(res, 200, user, "Profile updated");
});

export const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user!.id).select("+passwordHash");
  if (!user?.passwordHash) throw ApiError.badRequest("This account has no password set (Google login only)");

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw ApiError.unauthorized("Current password is incorrect");

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();

  return sendSuccess(res, 200, null, "Password changed successfully");
});

export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond the same way so we don't leak which emails exist.
  if (user) {
    const rawToken = generateRawToken();
    user.passwordResetTokenHash = hashToken(rawToken);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${rawToken}`;
    sendMail(email, "Reset your password", `<p>Click to reset: <a href="${resetUrl}">${resetUrl}</a></p>`).catch(
      () => {}
    );
  }

  return sendSuccess(res, 200, null, "If that email exists, a reset link has been sent");
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  const tokenHash = hashToken(token);

  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetTokenHash +passwordResetExpires");

  if (!user) throw ApiError.badRequest("Reset link is invalid or has expired");

  user.passwordHash = await bcrypt.hash(password, 12);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return sendSuccess(res, 200, null, "Password reset successfully. You can now log in.");
});

/**
 * Google OAuth: the frontend uses Google Identity Services to get an
 * ID token, then POSTs it here. We verify it server-side against Google's
 * public keys before trusting any of the profile data.
 */
export const googleAuth = catchAsync(async (req: Request, res: Response) => {
  const { idToken } = req.body as { idToken: string };
  if (!idToken) throw ApiError.badRequest("idToken is required");
  if (!env.GOOGLE_CLIENT_ID) throw ApiError.internal("Google login is not configured on this server");

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch {
    throw ApiError.unauthorized("Invalid Google token");
  }

  if (!payload?.email) throw ApiError.unauthorized("Google account has no verified email");

  const { sub: googleId, email, name, picture } = payload;

  let user = await User.findOne({ $or: [{ googleId }, { email }] });
  if (!user) {
    user = await User.create({
      name: name || email.split("@")[0],
      email,
      googleId,
      profileImage: picture,
      emailVerified: true,
    });
  } else if (!user.googleId) {
    user.googleId = googleId;
    if (picture) user.profileImage = picture;
    user.emailVerified = true;
  }

  if (user.accountStatus === "suspended") throw ApiError.forbidden("Account suspended");

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(user._id.toString());
  setAuthCookie(res, token);

  return sendSuccess(res, 200, { user, token }, "Logged in with Google");
});

export const updateNotificationPreferences = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(
    req.user!.id,
    { notificationPreferences: req.body },
    { new: true }
  );
  return sendSuccess(res, 200, user?.notificationPreferences, "Notification preferences updated");
});
