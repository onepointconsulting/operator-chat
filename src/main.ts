import express, { response } from "express";
import { wss } from "./server";
import { ChatCallback } from "./callback";

export const globalCallbacks: ChatCallback[] = [];

export function initChatServer(callbacks: ChatCallback[]) {
  const app = express();

  const server = app.listen(process.env.PORT || 3000);

  globalCallbacks.push(...callbacks);

  server.on("upgrade", (request, socket, head) => {
    try {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } catch (error) {
      console.error("WebSocket upgrade failed:", error);
      // Ensure the socket is destroyed to prevent hanging connections
      socket.destroy();
      // Optionally, you might want to end the HTTP request as well
      if (!response.writableEnded) {
        response.end("HTTP/1.1 500 Internal Server Error\r\n\r\n");
      }
    }
  });
}
