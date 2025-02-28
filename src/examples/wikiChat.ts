import { initChatServer } from "../main";
import { ChatCallback } from "../callback";
import { wikiSearch } from "../callbacks/wikiSearch";

/**
 * This is a simple example of a chat callback.
 * It will log the chat history to the console.
 */
initChatServer([
  new ChatCallback("wikiChat", wikiSearch),
]);
