import { ChatMessage } from "./types";

export class ChatCallback {
    constructor(
        private readonly _id: string,
        private readonly _callback: (chatHistory: ChatMessage[]) => ChatMessage[]
    ) {
        this._id = _id;
        this._callback = _callback;
    }

    get id(): string {
        return this._id;
    }

    get callback(): (chatHistory: ChatMessage[]) => ChatMessage[] {
        return this._callback;
    }
}
