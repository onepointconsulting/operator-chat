import { ChatMessage } from "../types";
import { Config } from "../config";

/**
 * Slices the chat history to the last sliceSize messages specified in the config
 * @param chatHistory - The chat history to slice
 * @returns The sliced chat history including the first message
 */
export async function sliceChatHistory(
  chatHistory: ChatMessage[],
): Promise<ChatMessage[]> {
  const sliceSize = Config.SLICE_SIZE;
  if (chatHistory.length < sliceSize) {
    return chatHistory;
  }
  const firstMessage = chatHistory[0];
  const slicedChatHistory = [firstMessage, ...chatHistory.slice(-sliceSize)];
  return slicedChatHistory;
}
