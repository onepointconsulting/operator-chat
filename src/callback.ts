import { ChatMessage } from "./types";

export class ChatCallback {
  constructor(
    private readonly _id: string,
    private readonly _callback: (
      chatHistory: ChatMessage[],
    ) => Promise<ChatMessage[]>,
    private readonly _isOperator: boolean = false,
  ) {
    this._id = _id;
    this._callback = _callback;
  }

  get id(): string {
    return this._id;
  }

  get callback(): (chatHistory: ChatMessage[]) => Promise<ChatMessage[]> {
    return this._callback;
  }

  get isOperator(): boolean {
    return this._isOperator;
  }
}
