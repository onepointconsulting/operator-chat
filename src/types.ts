import { WebSocket } from "ws";
import { SupportedLLMProvider } from "./enums";

export interface ChatMessage {
  role: "user" | "assistant" | "operator" | "system";
  content: string;
}

export interface Client {
  id: string;
  ws: WebSocket;
  chatHistory: ChatMessage[];
  isOperator: boolean;
  connectedTo?: string;
  name?: string;
}

export type LLMProvider =
  | SupportedLLMProvider.OPENAI
  | SupportedLLMProvider.GEMINI;
