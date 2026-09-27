import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { verifyToken } from "../utils/token";
import { env } from "../config/env";

interface AuthedSocket extends Socket {
  userId?: string;
}

/**
 * Real-time layer for:
 *  1) Project/Kanban updates  -> rooms: `project:<projectId>`
 *  2) Team chat (Slack-style) -> rooms: `channel:<channelId>`
 *  3) Personal notifications  -> rooms: `user:<userId>`
 */
export function initSocket(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use((socket: AuthedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.cookie
          ?.split("; ")
          .find((c) => c.startsWith(`${env.JWT_COOKIE_NAME}=`))
          ?.split("=")[1];

      if (!token) return next(new Error("Authentication required"));

      const payload = verifyToken(token);
      socket.userId = payload.userId;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: AuthedSocket) => {
    if (socket.userId) socket.join(`user:${socket.userId}`);

    // ---- Project / Kanban rooms ----
    socket.on("project:join", (projectId: string) => {
      socket.join(`project:${projectId}`);
    });
    socket.on("project:leave", (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    // ---- Chat channel rooms ----
    socket.on("channel:join", (channelId: string) => {
      socket.join(`channel:${channelId}`);
    });
    socket.on("channel:leave", (channelId: string) => {
      socket.leave(`channel:${channelId}`);
    });

    // Typing indicators, Slack-style.
    socket.on("channel:typing", ({ channelId, userName }: { channelId: string; userName: string }) => {
      socket.to(`channel:${channelId}`).emit("channel:typing", { userId: socket.userId, userName });
    });
    socket.on("channel:stop-typing", ({ channelId }: { channelId: string }) => {
      socket.to(`channel:${channelId}`).emit("channel:stop-typing", { userId: socket.userId });
    });

    socket.on("disconnect", () => {
      // Presence cleanup hook (e.g. broadcast "user offline") can go here.
    });
  });

  return io;
}
