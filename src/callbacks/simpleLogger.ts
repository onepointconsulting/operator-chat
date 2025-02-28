import { ChatMessage } from "../types";

export async function simpleLogger(chatHistory: ChatMessage[]): Promise<ChatMessage[]> {
  console.info("== Simple Chat Callback ==");
  console.info(chatHistory);
  return chatHistory;
} 