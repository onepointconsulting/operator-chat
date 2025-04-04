import { WebSocketServer, WebSocket } from "ws";
import { uuidv7 } from "uuidv7";
import { Conversation } from "./types";
import { LLMService } from "./llm-service";
import { MessageSubtype, MessageType, Role } from "./enums";
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
  handleClientId as handleRequestClientId,
  handleImportHistory,
  createInitialMessage,
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
const conversations = new Map<string, Conversation>();
const llmService = new LLMService();

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
  const conversationId = uuidv7(); // Conversation id
  const conversation: Conversation = {
    id: conversationId,
    ws,
    chatHistory: [createInitialMessage()],
    isOperator: false,
    predefinedQuestions: getInitialQuestions(),
  };
  conversations.set(conversationId, conversation);
  console.info(`Conversation ${conversationId} started`);

  handleConversationId(ws, conversationId);
  askPredefinedQuestion(ws, conversation);

  ws.on("message", async (message: string) => {
    console.log(`Received message: ${message}`);
    const data = JSON.parse(message);

    switch (data.type) {
      case MessageType.AUTH:
        ws.send(handleOperatorAuth(conversation, data.password));
        break;

      case MessageType.CONNECT:
        handleOperatorConnection(conversation, data.targetId, conversations);
        break;

      case MessageType.LIST_USERS:
        handleListUsers(ws, conversations);
        break;

      case MessageType.LIST_OPERATORS:
        handleListOperators(ws, conversations);
        break;

      case MessageType.MESSAGE:
        await handleChatMessage(conversation, data, conversations, llmService);
        break;

      case MessageType.SET_NAME:
        ws.send(handleSetName(conversation, data.name));
        break;

      case MessageType.DISCONNECT:
        handleDisconnect(conversation, conversations);
        break;

      case MessageType.REQUEST_CLIENT_ID:
        handleRequestClientId(ws, conversation.id);
        break;

      case MessageType.IMPORT_HISTORY:
        await handleImportHistory(conversation, data.history);
        break;

      default:
        conversation.ws.send(
          JSON.stringify({
            type: MessageType.ERROR,
            message: "Invalid command.",
          }),
        );
    }
  });

  ws.on("close", () => {
    if (conversation.connectedTo) {
      const target = conversations.get(conversation.connectedTo);
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
    conversations.delete(conversationId);
  });
});
