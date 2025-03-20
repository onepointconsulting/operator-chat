import { ChatMessage, Client } from "./types";

export abstract class BaseChatCallback {
  constructor(
    protected readonly _id: string,
    protected readonly _isOperator: boolean = false,
  ) {
    this._id = _id;
    this._isOperator = _isOperator;
  }

  get id(): string {
    return this._id;
  }

  get isOperator(): boolean {
    return this._isOperator;
  }

  abstract get callback(): (obj: any) => Promise<any>
}

export class ChatCallback extends BaseChatCallback {
  constructor(
    protected readonly _id: string,
    private readonly _callback: (chatHistory: ChatMessage[]) => Promise<ChatMessage[]>,
    protected readonly _isOperator: boolean = false,
  ) {
    super(_id, _isOperator);
    this._callback = _callback;
  }

  get callback(): (chatHistory: ChatMessage[]) => Promise<ChatMessage[]> {
    return this._callback;
  }
}

export class ClientCallback extends BaseChatCallback {
  constructor(
    protected readonly _id: string,
    private readonly _callback: (client: Client) => Promise<any>,
    protected readonly _isOperator: boolean = false,
  ) {
    super(_id, _isOperator);
    this._callback = _callback;
  }

  get callback(): (client: Client) => Promise<void> {
    return this._callback;
  }
}
