import { WebSocket } from "ws";
import { Interface } from "readline";

export function setupDisconnectHandlers(ws: WebSocket, rl: Interface) {
  ws.on("close", () => {
    console.log("\nDisconnected from server");
    rl.close();
    process.exit(0);
  });

  ws.on("error", (error) => {
    console.error("\nWebSocket error:", error.message);
    rl.close();
    process.exit(1);
  });
} 