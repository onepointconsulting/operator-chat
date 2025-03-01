import { WebSocket } from "ws";
import { Client, ChatMessage } from "./types";
import { LLMService } from "./llm-service";
import { MessageSubtype, MessageType } from "./enums";
import { Config } from "./config";
import { globalCallbacks } from "./main";

/**
 * Handles the connection between an operator and a user.
 * @param client - The operator client.
 * @param targetId - The ID of the user to connect to.
 * @param clients - The map of all clients.
 */
export function handleOperatorConnection(
  client: Client,
  targetId: string,
  clients: Map<string, Client>,
) {
  if (client.connectedTo) {
    client.ws.send(
      JSON.stringify({
        type: MessageType.ERROR,
        message: "You are already connected to a user.",
      }),
    );
    return;
  }

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
export function handleOperatorAuth(client: Client, password: string) {
  const correctPassword = password === Config.OPERATOR_PASSWORD;
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
export async function handleChatMessage(
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

  const activeCallbacks = globalCallbacks.filter((callback) => {
    if (!callback.isOperator && client.connectedTo) {
      return false;
    }
    return true;
  })

  for (const callback of activeCallbacks) {
    const promise = callback.callback;
    await promise(client.chatHistory);
  }

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

/**
 * Handles the request to list all connected users.
 * @param ws - The WebSocket connection to send the response to.
 * @param clients - Map of all connected clients.
 */
export function handleListUsers(ws: WebSocket, clients: Map<string, Client>) {
  ws.send(
    JSON.stringify({
      type: MessageType.USERS_LIST,
      users: Array.from(clients.values()).filter((c) => !c.isOperator),
    }),
  );
}

/**
 * Handles the request to list all connected operators.
 * @param ws - The WebSocket connection to send the response to.
 * @param clients - Map of all connected clients.
 */
export function handleListOperators(
  ws: WebSocket,
  clients: Map<string, Client>,
) {
  ws.send(
    JSON.stringify({
      type: MessageType.LIST_OPERATORS,
      operators: Array.from(clients.values()).filter((c) => c.isOperator),
    }),
  );
}

/**
 * Handles client disconnection.
 * @param client - The client disconnecting.
 * @param clients - Map of all connected clients.
 */
export function handleDisconnect(client: Client, clients: Map<string, Client>) {
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
}

/**
 * Handles setting a client's name.
 * @param client - The client to set the name for.
 * @param name - The name to set.
 */
export function handleSetName(client: Client, name: string) {
  client.name = name;
  return JSON.stringify({
    type: MessageType.SET_NAME,
    clientId: client.id,
    name: client.name,
  });
}
