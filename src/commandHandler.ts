import { WebSocket } from "ws";
import { Conversation, ChatMessage } from "./types";
import { LLMService } from "./llm-service";
import { MessageSubtype, MessageType, Role } from "./enums";
import { Config } from "./config";
import { globalCallbacks } from "./main";
import { sliceHistory } from "./history";
import { ConversationCallback } from "./callback";
import { uuidv7 } from "uuidv7";
import { readPrompts } from "./prompts";

const BASIC_SYSTEM_MESSAGE = (readPrompts().basic as any).system_message;

export function createInitialMessage() {
  return { role: Role.SYSTEM, content: BASIC_SYSTEM_MESSAGE }
}

/**
 * Handles the connection between an operator and a user.
 * @param conversation - The operator conversation.
 * @param targetId - The ID of the user to connect to.
 * @param conversations - The map of all conversation.
 */
export function handleOperatorConnection(
  conversation: Conversation,
  targetId: string,
  conversations: Map<string, Conversation>,
) {
  if (conversation.connectedTo) {
    conversation.ws.send(
      JSON.stringify({
        type: MessageType.ERROR,
        message: "You are already connected to a user.",
      }),
    );
    return;
  }

  const targetConversation = conversations.get(targetId);
  if (!targetConversation) {
    conversation.ws.send(
      JSON.stringify({ type: MessageType.ERROR, message: "User not found." }),
    );
    return;
  }

  if (!targetConversation.connectedTo) {
    conversation.connectedTo = targetConversation.id;
    targetConversation.connectedTo = conversation.id;
    conversation.ws.send(
      JSON.stringify({
        type: MessageType.CONNECTED,
        targetId: targetConversation.id,
      }),
    );
    targetConversation.ws.send(
      JSON.stringify({
        type: MessageType.MESSAGE,
        subType: MessageSubtype.OPERATOR_CONNECTED,
      }),
    );
  }
}

/**
 * Handles operator authentication.
 * @param conversation - The conversation attempting to authenticate.
 * @param password - The password provided in the conversations.
 * @returns The authentication response message.
 */
export function handleOperatorAuth(
  conversation: Conversation,
  password: string,
) {
  const correctPassword = password === Config.OPERATOR_PASSWORD;
  conversation.isOperator = correctPassword;
  return JSON.stringify({
    type: MessageType.LOGIN_RESPONSE,
    success: correctPassword,
  });
}

/**
 * Handles incoming chat messages from conversation.
 * @param conversation - The conversation from which the message was sent.
 * @param content - The message content.
 * @param conversations - Map of all connected conversation.
 * @param llmService - The LLM service instance.
 */
export async function handleChatMessage(
  conversation: Conversation,
  data: { content: string; clientId: string },
  conversations: Map<string, Conversation>,
  llmService: LLMService,
) {
  const chatMessage: ChatMessage = {
    role: conversation.isOperator ? Role.OPERATOR : Role.USER,
    content: data.content,
  };

  conversation.chatHistory.push(chatMessage);
  conversation.clientId = data.clientId;

  sliceHistory(conversation);

  await handleCallbacks(conversation, true);

  if (conversation.connectedTo) {
    const target = conversations.get(conversation.connectedTo);
    if (target) {
      target.chatHistory.push(chatMessage);
      target.ws.send(
        JSON.stringify({
          type: MessageType.MESSAGE,
          message: chatMessage,
          conversationId: conversation.id,
        }),
      );
      conversation.ws.send(
        JSON.stringify({
          type: MessageType.MESSAGE_SENT,
        }),
      );
    }
  } else {
    // The user is not connected to any operator.
    if (conversation.isOperator) {
      conversation.ws.send(
        JSON.stringify({
          type: MessageType.ERROR,
          message: "You are not connected to any user.",
        }),
      );
    } else {
      // The user is not an operator.
      if (!askPredefinedQuestion(conversation.ws, conversation)) {
        await llmService.handleLLMResponse(
          conversation,
          conversation.chatHistory,
        );
      }
    }
  }
  // Execute all applicable callbacks
  await handleCallbacks(conversation, false);
}

/**
 * Handles the request to list all connected users.
 * @param ws - The WebSocket connection to send the response to.
 * @param conversations - Map of all connected conversations.
 */
export function handleListUsers(
  ws: WebSocket,
  conversations: Map<string, Conversation>,
) {
  ws.send(
    JSON.stringify({
      type: MessageType.USERS_LIST,
      users: Array.from(conversations.values()).filter((c) => !c.isOperator),
    }),
  );
}

/**
 * Handles the request to list all connected operators.
 * @param ws - The WebSocket connection to send the response to.
 * @param conversations - Map of all connected conversations.
 */
export function handleListOperators(
  ws: WebSocket,
  conversations: Map<string, Conversation>,
) {
  ws.send(
    JSON.stringify({
      type: MessageType.LIST_OPERATORS,
      operators: Array.from(conversations.values()).filter((c) => c.isOperator),
    }),
  );
}

/**
 * Handles conversation disconnection.
 * @param conversation - The conversation disconnecting.
 * @param conversations - Map of all connected conversations.
 */
export function handleDisconnect(
  conversation: Conversation,
  conversations: Map<string, Conversation>,
) {
  if (conversation.connectedTo) {
    const target = conversations.get(conversation.connectedTo);
    if (target) {
      target.connectedTo = undefined;
      const targets = [target, conversation];
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
  // Free memory
  conversations.delete(conversation.id);
}

/**
 * Handles setting a conversation's name.
 * @param conversation - The conversation to set the name for.
 * @param name - The name to set.
 */
export function handleSetName(conversation: Conversation, name: string) {
  conversation.name = name;
  return JSON.stringify({
    type: MessageType.SET_NAME,
    conversationId: conversation.id,
    name: conversation.name,
  });
}

/**
 * Asks a predefined question to the user.
 * @param ws - The WebSocket connection to send the response to.
 * @param conversations - Map of all connected conversations.
 */
export function askPredefinedQuestion(
  ws: WebSocket,
  conversations: Conversation,
): boolean {
  const questions = conversations.predefinedQuestions;
  if (!questions || questions.length === 0) {
    return false;
  }
  const question = questions[0];
  conversations.predefinedQuestions = questions.slice(1);
  conversations.chatHistory.push({
    role: Role.ASSISTANT,
    content: question,
  });
  ws.send(
    JSON.stringify({
      type: MessageType.MESSAGE,
      message: {
        role: Role.ASSISTANT,
        content: question,
      },
    }),
  );
  return true;
}

/**
 * Executes all applicable callbacks for a conversation
 * @param conversation - The conversation to execute callbacks for
 * @returns The updated chat history after all callbacks have been executed
 */
export async function handleCallbacks(
  conversation: Conversation,
  beforeMessage: boolean,
) {
  // Filter callbacks that should be executed
  const activeCallbacks = globalCallbacks.filter((callback) => {
    if (!callback.isOperator && conversation.connectedTo) {
      return false;
    }
    if (beforeMessage !== callback.beforeMessage) {
      return false;
    }
    return true;
  });

  // Execute callbacks sequentially
  for (const callback of activeCallbacks) {
    const promise = callback.callback;
    if (callback instanceof ConversationCallback) {
      await promise(conversation);
    } else {
      conversation.chatHistory = await promise(conversation.chatHistory);
    }
  }
}

export function handleConversationId(ws: WebSocket, conversationId: string) {
  ws.send(
    JSON.stringify({
      type: MessageType.CONVERSATION_ID,
      conversationId: conversationId,
    }),
  );
}

export function handleClientId(ws: WebSocket, conversationId: string) {
  ws.send(
    JSON.stringify({
      type: MessageType.CLIENT_ID,
      clientId: uuidv7(),
      conversationId,
    }),
  );
}

export function handleImportHistory(conversation: Conversation, history: ChatMessage[]) {
  conversation.chatHistory = [createInitialMessage(), ...history];
}
