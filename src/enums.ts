export enum MessageType {
  STREAM_START = "stream-start",
  STREAM_CHUNK = "stream-chunk",
  STREAM_END = "stream-end",
  LOGIN_RESPONSE = "login-response",
  MESSAGE = "message",
  MESSAGE_SENT = "message-sent",
  ERROR = "error",
  AUTH = "auth",
  CONNECT = "connect",
  CONNECTED = "connected",
  DISCONNECT = "disconnect",
  QUIT = "quit",
  LIST_USERS = "list-users",
  USERS_LIST = "users-list",
  LIST_OPERATORS = "list-operators",
  SET_NAME = "set-name",
  CONVERSATION_ID = "conversation-id",
  REQUEST_CLIENT_ID = "request-client-id",
  CLIENT_ID = "client-id",
}

export enum Command {
  HELP = "help",
}

export enum MessageSubtype {
  OPERATOR_DISCONNECTED = "operatorDisconnected",
  OPERATOR_CONNECTED = "operatorConnected",
  STREAM_END_ERROR = "streamEndError",
}

export enum SupportedLLMProvider {
  OPENAI = "openai",
  GEMINI = "gemini",
}
