import { server as httpServer } from "./server";
import { ChatCallback } from "./callback";
import { Config } from "./config";
 
export const globalCallbacks: ChatCallback[] = [];

export function initChatServer(callbacks: ChatCallback[], port: number = parseInt(Config.PORT!)) {
  httpServer.listen(port, () => {
    console.log(`WebSocket server is running on port ${port}`);
  });

  globalCallbacks.push(...callbacks);

  return httpServer;
}
