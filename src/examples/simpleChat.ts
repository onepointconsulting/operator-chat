import { initChatServer } from "../main";
import { ChatCallback } from "../callback";
import { simpleLogger } from "../callbacks/simpleLogger";

/**
 * This is a simple example of a chat callback.
 * It will log the chat history to the console.
 */
initChatServer([new ChatCallback("simpleChat", simpleLogger)]);
