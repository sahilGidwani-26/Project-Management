import jwt from "jsonwebtoken";
import { Response } from "express";
import { env } from "../config/env";

export interface JwtPayload {
  userId: string;
}

export function signToken(userId: string): string {
  return jwt.sign({ userId } as JwtPayload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function setAuthCookie(res: Response, token: string) {
  const isProd = env.NODE_ENV === "production";
  res.cookie(env.JWT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(env.JWT_COOKIE_NAME, { path: "/" });
}
