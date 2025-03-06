import { getInitialQuestions, getMaxHistorySize } from "./prompts";
import { Client } from "./types";

const initialQuestions = getInitialQuestions();
const maxHistorySize = getMaxHistorySize();
const initialHistoryEntries = initialQuestions.length * 2 + 1;

/**
 * Slices the chat history to the last sliceSize messages specified in the config.
 * Preserves the initial history entries from predefined questions.
 * @param client - The client to slice the history for
 */
export function sliceHistory(client: Client) {
  const history = client.chatHistory;
  if (history.length <= initialHistoryEntries + maxHistorySize) {
    return;
  }
  const initialHistory = client.isOperator ? [] : history.slice(0, initialHistoryEntries);
  const slicedHistory = history.slice(-maxHistorySize);
  client.chatHistory = [...initialHistory, ...slicedHistory];
}
