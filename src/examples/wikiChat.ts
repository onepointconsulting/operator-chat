import { initChatServer } from "../main";
import { ChatCallback } from "../callback";
import { wikiSearch } from "../callbacks/wikiSearch";
import { sliceChatHistory } from "../callbacks/slicer";

/**
 * This is a simple example of a chat callback.
 * It will log the chat history to the console.
 */
initChatServer([
  new ChatCallback("wikiChat", wikiSearch),
  new ChatCallback("slicer", sliceChatHistory),
]);
