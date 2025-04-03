import { ChatMessage, Conversation } from "./types";

export abstract class BaseChatCallback {
  constructor(
    protected readonly _id: string,
    protected readonly _isOperator: boolean = false,
    protected readonly _beforeMessage: boolean = false,
  ) {
    this._id = _id;
    this._isOperator = _isOperator;
    this._beforeMessage = _beforeMessage;
  }

  get id(): string {
    return this._id;
  }

  get isOperator(): boolean {
    return this._isOperator;
  }

  get beforeMessage(): boolean {
    return this._beforeMessage;
  }

  abstract get callback(): (obj: any) => Promise<any>;
}

export class ChatCallback extends BaseChatCallback {
  constructor(
    protected readonly _id: string,
    private readonly _callback: (
      chatHistory: ChatMessage[],
    ) => Promise<ChatMessage[]>,
    protected readonly _beforeMessage: boolean = false,
    protected readonly _isOperator: boolean = false,
  ) {
    super(_id, _isOperator, _beforeMessage);
    this._callback = _callback;
  }

  get callback(): (chatHistory: ChatMessage[]) => Promise<ChatMessage[]> {
    return this._callback;
  }
}

export class ConversationCallback extends BaseChatCallback {
  constructor(
    protected readonly _id: string,
    private readonly _callback: (conversation: Conversation) => Promise<any>,
    protected readonly _beforeMessage: boolean = false,
    protected readonly _isOperator: boolean = false,
  ) {
    super(_id, _isOperator, _beforeMessage);
    this._callback = _callback;
  }

  get callback(): (conversation: Conversation) => Promise<void> {
    return this._callback;
  }
}
