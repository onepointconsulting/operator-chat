export enum MessageType {
    STREAM_START = 'stream-start',
    STREAM_CHUNK = 'stream-chunk',
    STREAM_END = 'stream-end',
    LOGIN_RESPONSE = 'login-response',
    MESSAGE = 'message',
    ERROR = 'error',
    AUTH = 'auth',
    CONNECT = 'connect',
    CONNECTED = 'connected',
    DISCONNECT = 'disconnect',
    QUIT = 'quit',
    LIST_USERS = 'list-users',
    USERS_LIST = 'users-list',
}

export enum SupportedLLMProvider {
    OPENAI = 'openai',
    GEMINI = 'gemini',
}

