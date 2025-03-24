import { getInitialQuestions, getMaxHistorySize } from "./prompts";
import { Conversation } from "./types";

const initialQuestions = getInitialQuestions();
const maxHistorySize = getMaxHistorySize();
const initialHistoryEntries = initialQuestions.length * 2 + 1;

/**
 * Slices the chat history to the last sliceSize messages specified in the config.
 * Preserves the initial history entries from predefined questions.
 * @param conversation - The conversation to slice the history for
 */
export function sliceHistory(conversation: Conversation) {
  const history = conversation.chatHistory;
  if (history.length <= initialHistoryEntries + maxHistorySize) {
    return conversation.chatHistory;
  }
  const initialHistory = conversation.isOperator
    ? []
    : history.slice(0, initialHistoryEntries);
  const slicedHistory = history.slice(-maxHistorySize);
  conversation.chatHistory = [...initialHistory, ...slicedHistory];
  return conversation.chatHistory;
}
