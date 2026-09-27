/// <reference path="./types/express.d.ts" />
import http from "http";
import { createApp } from "./app";
import { connectDB } from "./config/db";
import { initSocket } from "./sockets";
import { env } from "./config/env";

async function bootstrap() {
  await connectDB();

  const app = createApp();
  const httpServer = http.createServer(app);

  const io = initSocket(httpServer);
  app.set("io", io);

  httpServer.listen(env.PORT, () => {
    console.log(`[server] Running on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });
}

bootstrap().catch((err) => {
  console.error("[server] Failed to start:", err);
  process.exit(1);
});