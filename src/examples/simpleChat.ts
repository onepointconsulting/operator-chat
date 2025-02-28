import { initChatServer } from "../main";
import { ChatCallback } from "../callback";

/**
 * This is a simple example of a chat callback.
 * It will log the chat history to the console.
 */
initChatServer([
  new ChatCallback("simpleChat", async (chatHistory) => {
    console.info("== Simple Chat Callback ==");
    console.info(chatHistory);
    return chatHistory;
  }),
]);
