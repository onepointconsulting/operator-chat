import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMessage, LLMProvider } from "./types";
import { MessageSubtype, MessageType, SupportedLLMProvider } from "./enums";
import { Client } from "./types";

function convertMessage(role: string) {
  return role === "operator" ? "user" : role;
}

function prepareMessages(messages: ChatMessage[]) {
  return messages.map((m) => ({
    role: convertMessage(m.role),
    content: m.content,
  }));
}

export class LLMService {
  private openai: ChatOpenAI;
  private gemini: ChatGoogleGenerativeAI;
  private currentProvider: LLMProvider;

  constructor() {
    this.openai = new ChatOpenAI({
      model: process.env.OPENAI_MODEL!,
      apiKey: process.env.OPENAI_API_KEY!,
    });
    this.gemini = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY!,
      modelName: process.env.GEMINI_MODEL!,
    });
    this.currentProvider = process.env.INITIAL_PROVIDER as LLMProvider;
  }

  setProvider(provider: LLMProvider) {
    this.currentProvider = provider;
  }

  getProvider(): LLMProvider {
    return this.currentProvider;
  }

  async generateResponse(messages: ChatMessage[]): Promise<string> {
    const formattedMessages = prepareMessages(messages);

    if (this.currentProvider === SupportedLLMProvider.OPENAI) {
      const response = await this.openai.invoke(formattedMessages);
      return typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);
    } else {
      const response = await this.gemini.invoke(formattedMessages);
      return typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);
    }
  }

  private async *processStreamChunks(
    messageStream: AsyncIterable<any>,
  ): AsyncGenerator<string> {
    for await (const chunk of messageStream) {
      if (chunk?.content) {
        yield chunk.content.toString();
      }
    }
  }

  async *openAiStream(messages: ChatMessage[]): AsyncGenerator<string> {
    const stream = await this.openai.stream(prepareMessages(messages));
    yield* this.processStreamChunks(stream);
  }

  async *geminiAiStream(messages: ChatMessage[]): AsyncGenerator<string> {
    const stream = await this.gemini.stream(prepareMessages(messages));
    yield* this.processStreamChunks(stream);
  }

  async *generateResponseStream(
    messages: ChatMessage[],
  ): AsyncGenerator<string> {
    switch (this.currentProvider) {
      case SupportedLLMProvider.OPENAI:
        yield* this.openAiStream(messages);
        break;
      case SupportedLLMProvider.GEMINI:
        yield* this.geminiAiStream(messages);
        break;
    }
  }

  async handleLLMResponse(client: Client, messages: ChatMessage[]) {
    try {
      client.ws.send(
        JSON.stringify({
          type: MessageType.STREAM_START,
          message: { role: "assistant", content: "" },
        }),
      );

      let fullResponse = "";
      for await (const chunk of this.generateResponseStream(messages)) {
        fullResponse += chunk;
        client.ws.send(
          JSON.stringify({
            type: MessageType.STREAM_CHUNK,
            chunk,
          }),
        );
      }

      const aiMessage: ChatMessage = {
        role: "assistant",
        content: fullResponse,
      };
      client.chatHistory.push(aiMessage);

      client.ws.send(
        JSON.stringify({
          type: MessageType.STREAM_END,
          message: aiMessage,
        }),
      );
    } catch (error) {
      console.error("Error in streaming response:", error);
      client.ws.send(
        JSON.stringify({
          type: MessageType.STREAM_END,
          subType: MessageSubtype.STREAM_END_ERROR,
          message: "Error generating response",
        }),
      );
    }
  }
}
