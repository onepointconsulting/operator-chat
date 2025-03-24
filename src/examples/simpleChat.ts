import { initChatServer } from "../main";
import { ChatCallback, ConversationCallback } from "../callback";
import { simpleLogger } from "../callbacks/simpleLogger";
import { clientIdLog } from "../callbacks/clientIdLog";

/**
 * This is a simple example of a chat callback.
 * It will log the chat history to the console.
 */
initChatServer([
    new ChatCallback("simpleChat", simpleLogger), 
    new ConversationCallback("clientIdLog", clientIdLog)
]);
