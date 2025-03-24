import { WebSocketServer, WebSocket } from "ws";
import { uuidv7 } from 'uuidv7'
import { Conversation } from "./types";
import { LLMService } from "./llm-service";
import { MessageSubtype, MessageType } from "./enums";
import { getInitialQuestions, readPrompts } from "./prompts";
import {
  handleOperatorConnection,
  handleOperatorAuth,
  handleChatMessage,
  handleListUsers,
  handleListOperators,
  handleDisconnect,
  handleSetName,
  askPredefinedQuestion,
  handleConversationId,
} from "./commandHandler";
import http from "http";

// Create HTTP server
export const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Handle regular requests
  res.writeHead(404);
  res.end();
});

// Create WebSocket server attached to HTTP server
export const wss = new WebSocketServer({ noServer: true });
const clients = new Map<string, Conversation>();
const llmService = new LLMService();

const BASIC_SYSTEM_MESSAGE = (readPrompts().basic as any).system_message;

// Handle upgrade requests
server.on("upgrade", (request, socket, head) => {
  // Check origin for CORS
  // const origin = request.headers.origin || '*';

  // You can implement origin validation here if needed
  // For now, we're accepting all origins
  // if (origin !== 'https://your-allowed-domain.com') {
  //   socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
  //   socket.destroy();
  //   return;
  // }

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

wss.on("connection", (ws: WebSocket) => {
  const clientId = uuidv7(); // Conversation id
  const client: Conversation = {
    id: clientId,
    ws,
    chatHistory: [{ role: "system", content: BASIC_SYSTEM_MESSAGE }],
    isOperator: false,
    predefinedQuestions: getInitialQuestions(),
  };
  clients.set(clientId, client);
  console.info(`Client ${clientId} connected`);

  handleConversationId(ws, clientId);
  askPredefinedQuestion(ws, client);

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
