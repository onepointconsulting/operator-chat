import { initChatServer } from "../main";
import { ConversationCallback } from "../callback";
import { fileSaver } from "../callbacks/fileSaver";

initChatServer([new ConversationCallback("fileSaveChat", fileSaver, false)]);
