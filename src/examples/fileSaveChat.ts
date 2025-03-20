import { initChatServer } from "../main";
import { ClientCallback } from "../callback";
import { fileSaver } from "../callbacks/fileSaver";


initChatServer([new ClientCallback("fileSaveChat", fileSaver)]);

