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
}

export enum SupportedLLMProvider {
  OPENAI = "openai",
  GEMINI = "gemini",
}
