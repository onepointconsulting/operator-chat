import dotenv from "dotenv";
dotenv.config();

import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import { Client, ChatMessage } from "./types";
import { LLMService } from "./llm-service";
import { MessageSubtype, MessageType } from "./enums";

export const wss = new WebSocketServer({ noServer: true });
const clients = new Map<string, Client>();
const llmService = new LLMService();

/**
 * Handles the connection between an operator and a user.
 * @param client - The operator client.
 * @param targetId - The ID of the user to connect to.
 * @param clients - The map of all clients.
 */
function handleOperatorConnection(
  client: Client,
  targetId: string,
  clients: Map<string, Client>,
) {
  if (!client.isOperator || client.connectedTo) return;

  const targetClient = clients.get(targetId);
  if (!targetClient) {
    client.ws.send(
      JSON.stringify({ type: MessageType.ERROR, message: "User not found." }),
    );
    return;
  }

  if (!targetClient.connectedTo) {
    client.connectedTo = targetClient.id;
    targetClient.connectedTo = client.id;
    client.ws.send(
      JSON.stringify({
        type: MessageType.CONNECTED,
        targetId: targetClient.id,
      }),
    );
    targetClient.ws.send(
      JSON.stringify({
        type: MessageType.MESSAGE,
        subType: MessageSubtype.OPERATOR_CONNECTED,
      }),
    );
  }
}

/**
 * Handles operator authentication.
 * @param client - The client attempting to authenticate.
 * @param password - The password provided by the client.
 * @returns The authentication response message.
 */
function handleOperatorAuth(client: Client, password: string) {
  const correctPassword = password === process.env.OPERATOR_PASSWORD;
  client.isOperator = correctPassword;
  return JSON.stringify({
    type: MessageType.LOGIN_RESPONSE,
    success: correctPassword,
  });
}

/**
 * Handles incoming chat messages from clients.
 * @param client - The client sending the message.
 * @param content - The message content.
 * @param clients - Map of all connected clients.
 * @param llmService - The LLM service instance.
 */
async function handleChatMessage(
  client: Client,
  content: string,
  clients: Map<string, Client>,
  llmService: LLMService,
) {
  const chatMessage: ChatMessage = {
    role: client.isOperator ? "operator" : "user",
    content,
  };

  client.chatHistory.push(chatMessage);

  if (client.connectedTo) {
    const target = clients.get(client.connectedTo);
    if (target) {
      target.chatHistory.push(chatMessage);
      target.ws.send(
        JSON.stringify({
          type: MessageType.MESSAGE,
          message: chatMessage,
          clientId: client.id,
        }),
      );
      client.ws.send(
        JSON.stringify({
          type: MessageType.MESSAGE_SENT,
        }),
      );
    }
  } else {
    if (client.isOperator) {
      client.ws.send(
        JSON.stringify({
          type: MessageType.ERROR,
          message: "You are not connected to any user.",
        }),
      );
    } else {
      await llmService.handleLLMResponse(client, client.chatHistory);
    }
  }
}

wss.on("connection", (ws: WebSocket) => {
  const clientId = uuidv4();
  const client: Client = {
    id: clientId,
    ws,
    chatHistory: [],
    isOperator: false,
  };
  clients.set(clientId, client);

  ws.on("message", async (message: string) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case MessageType.AUTH:
        ws.send(handleOperatorAuth(client, data.password));
        break;

      case MessageType.CONNECT:
        handleOperatorConnection(client, data.targetId, clients);
        break;

      case MessageType.LIST_USERS:
        ws.send(
          JSON.stringify({
            type: MessageType.USERS_LIST,
            users: Array.from(clients.values()),
          }),
        );
        break;

      case MessageType.LIST_OPERATORS:
        ws.send(
          JSON.stringify({
            type: MessageType.LIST_OPERATORS,
            operators: Array.from(clients.values()).filter((c) => c.isOperator),
          }),
        );
        break;

      case MessageType.MESSAGE:
        await handleChatMessage(client, data.content, clients, llmService);
        break;

      case MessageType.SET_NAME:
        client.name = data.name;
        ws.send(
          JSON.stringify({
            type: MessageType.SET_NAME,
            clientId: client.id,
            name: client.name,
          }),
        );
        break;

      case MessageType.DISCONNECT:
        if (client.connectedTo) {
          const target = clients.get(client.connectedTo);
          if (target) {
            target.connectedTo = undefined;
            const targets = [target, client];
            for (const target of targets) {
              target.ws.send(
                JSON.stringify({
                  type: MessageType.MESSAGE,
                  subType: MessageSubtype.OPERATOR_DISCONNECTED,
                }),
              );
              target.connectedTo = undefined;
            }
          }
        }
        break;
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


