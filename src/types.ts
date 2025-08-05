import { WebSocket } from "ws";
import { SupportedLLMProvider, Role } from "./enums";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp?: Date
}

export interface Conversation {
  id: string;
  ws: WebSocket;
  chatHistory: ChatMessage[];
  isOperator: boolean;
  connectedTo?: string;
  name?: string;
  predefinedQuestions?: string[];
  clientId?: string;
}

export type LLMProvider =
  | SupportedLLMProvider.OPENAI
  | SupportedLLMProvider.GEMINI;

export interface PromtConfig {
  basic: {
    system_message: string;
    initial_questions: string[];
  };
  configuration: {
    max_history_size: number;
  };
}
