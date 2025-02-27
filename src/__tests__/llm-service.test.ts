import { LLMService } from '../llm-service';
import { SupportedLLMProvider } from '../enums';
import { ChatMessage } from '../types';

describe('LLMService', () => {
  let llmService: LLMService;

  beforeEach(() => {
    llmService = new LLMService();
  });

  it('should initialize with default provider', () => {
    expect(llmService).toBeDefined();
  });

  it('should allow setting provider', () => {
    const provider = SupportedLLMProvider.OPENAI;
    llmService.setProvider(provider);
    expect(llmService.getProvider()).toBe(provider);
  });

  async function generateResponse(provider: SupportedLLMProvider) {
    llmService.setProvider(provider);
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: 'Hello, how are you?'
      }
    ];
    const response = await llmService.generateResponse(messages);
    expect(response).toBeDefined();
    expect(typeof response).toBe('string');
  }

  it('should generate response', async () => {
    await generateResponse(SupportedLLMProvider.OPENAI);
  });

  it('should generate response with gemini', async () => {
    await generateResponse(SupportedLLMProvider.GEMINI);
  });
}); 