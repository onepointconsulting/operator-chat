import { initChatServer } from "../main";
import { ChatCallback } from "../callback";

initChatServer([
    new ChatCallback("simpleChat", (chatHistory) => {
        console.info("== Simple Chat Callback ==");
        console.info(chatHistory);
        return chatHistory;
    })
])
