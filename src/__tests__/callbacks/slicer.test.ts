import { uuidv7 } from "uuidv7";
import { sliceHistory } from "../../history";
import { ChatMessage, Conversation } from "../../types";
import { WebSocket } from "ws";

describe("sliceChatHistory", () => {
  const systemMessage: ChatMessage = {
    role: "system",
    content: "system message",
  };
  const createMessages = (count: number): ChatMessage[] => {
    return [
      systemMessage,
      ...Array.from(
        { length: count - 1 },
        (_, i) =>
          ({
            role: "user",
            content: `message ${i + 1}`,
          }) as ChatMessage,
      ),
    ];
  };

  const createConversation = (count: number): Conversation => {
    return {
      id: uuidv7(),
      ws: {
        send: jest.fn(),
        isPaused: jest.fn(),
        ping: jest.fn(),
        pong: jest.fn(),
        terminate: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        once: jest.fn(),
        emit: jest.fn(),
        listeners: jest.fn(),
        listenerCount: jest.fn(),
        removeListener: jest.fn(),
        removeAllListeners: jest.fn(),
        setMaxListeners: jest.fn(),
        getMaxListeners: jest.fn(),
        rawListeners: jest.fn(),
        prependListener: jest.fn(),
        prependOnceListener: jest.fn(),
        eventNames: jest.fn(),
      } as unknown as WebSocket,
      chatHistory: createMessages(count),
      isOperator: false,
    };
  };

  it("should return original history if length is less than slice size", async () => {
    const conversation = createConversation(5);
    const result = await sliceHistory(conversation);
    expect(result).toEqual(conversation.chatHistory);
  });

  it("should keep system message and last N messages", async () => {
    const history = createConversation(15);

    const changedHistory = await sliceHistory(history);
    expect(changedHistory[0]).toEqual(systemMessage);
    expect(changedHistory.length).toBe(10); // system message + 10 latest
  });
});
