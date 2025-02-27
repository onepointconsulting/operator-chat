import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import { Client } from "./types";
import { LLMService } from "./llm-service";
import { MessageSubtype, MessageType } from "./enums";
import { readPrompts } from "./prompts";
import {
  handleOperatorConnection,
  handleOperatorAuth,
  handleChatMessage,
  handleListUsers,
  handleListOperators,
  handleDisconnect,
  handleSetName
} from "./commandHandler";

export const wss = new WebSocketServer({ noServer: true });
const clients = new Map<string, Client>();
const llmService = new LLMService();

const BASIC_SYSTEM_MESSAGE = (readPrompts().basic as any).system_message;

wss.on("connection", (ws: WebSocket) => {
  const clientId = uuidv4();
  const client: Client = {
    id: clientId,
    ws,
    chatHistory: [{ role: "system", content: BASIC_SYSTEM_MESSAGE }],
    isOperator: false,
  };
  clients.set(clientId, client);

  ws.on("message", async (message: string) => {
    console.log(`Received message: ${message}`);
    const data = JSON.parse(message);

    switch (data.type) {
      case MessageType.AUTH:
        ws.send(handleOperatorAuth(client, data.password));
        break;

      case MessageType.CONNECT:
        handleOperatorConnection(client, data.targetId, clients);
        break;

      case MessageType.LIST_USERS:
        handleListUsers(ws, clients);
        break;

      case MessageType.LIST_OPERATORS:
        handleListOperators(ws, clients);
        break;

      case MessageType.MESSAGE:
        await handleChatMessage(client, data.content, clients, llmService);
        break;

      case MessageType.SET_NAME:
        ws.send(handleSetName(client, data.name));
        break;

      case MessageType.DISCONNECT:
        handleDisconnect(client, clients);
        break;

      default:
        client.ws.send(
          JSON.stringify({
            type: MessageType.ERROR,
            message: "Invalid command.",
          }),
        );
    }
  });

  ws.on("close", () => {
    if (client.connectedTo) {
      const target = clients.get(client.connectedTo);
      if (target) {
        target.connectedTo = undefined;
        target.ws.send(
          JSON.stringify({
            type: MessageType.MESSAGE,
            subType: MessageSubtype.OPERATOR_DISCONNECTED,
          }),
        );
      }
    }
    clients.delete(clientId);
  });
});
