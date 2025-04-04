import { LLMService } from "../../llm-service";
import { ChatMessage } from "../../types";
import { Role } from "../../enums";

export const mockChatMessage: ChatMessage = {
  role: Role.USER,
  content: "Hello, how are you?",
};

export const mockConversation = {
  id: "test-id",
  ws: {
    send: jest.fn(),
  },
  chatHistory: [],
  isOperator: false,
};

describe("LLMService", () => {
  let llmService: LLMService;

  beforeEach(() => {
    llmService = new LLMService();
  });

  it("should initialize with default provider", () => {
    expect(llmService).toBeDefined();
  });
});
