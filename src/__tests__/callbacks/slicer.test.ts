import { sliceChatHistory } from "../../callbacks/slicer";
import { ChatMessage } from "../../types";

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

  it("should return original history if length is less than slice size", async () => {
    const history = createMessages(5);
    const result = await sliceChatHistory(history);
    expect(result).toEqual(history);
  });

  it("should keep system message and last N messages", async () => {
    const history = createMessages(15);
    const result = await sliceChatHistory(history);

    expect(result[0]).toEqual(systemMessage);
    expect(result.length).toBe(11); // system message + 10 latest
    expect(result.slice(1)).toEqual(history.slice(-10));
  });
});
