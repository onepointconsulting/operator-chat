import { LLMService } from "../../llm-service";
import { ChatMessage } from "../../types";

export const mockChatMessage: ChatMessage = {
  role: 'user',
  content: 'Hello, how are you?'
};

export const mockClient = {
  id: 'test-id',
  ws: {
    send: jest.fn()
  },
  chatHistory: [],
  isOperator: false
}; 

describe('LLMService', () => {
    let llmService: LLMService;

    beforeEach(() => {
        llmService = new LLMService();
    });

    it('should initialize with default provider', () => {
        expect(llmService).toBeDefined();
    });
    
    
})