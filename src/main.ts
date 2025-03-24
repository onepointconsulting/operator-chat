import { server as httpServer } from "./server";
import { BaseChatCallback } from "./callback";
import { Config } from "./config";

export const globalCallbacks: BaseChatCallback[] = [];

export function initChatServer(
  callbacks: BaseChatCallback[],
  port: number = parseInt(Config.PORT!),
) {
  httpServer.listen(port, () => {
    console.log(`WebSocket server is running on port ${port}`);
  });

  globalCallbacks.push(...callbacks);

  return httpServer;
}
