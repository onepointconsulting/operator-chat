import OpenAI from "openai";
import { Client } from "./types";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ChatMessage, LLMProvider } from "./types";
import { MessageSubtype, MessageType, SupportedLLMProvider } from "./enums";

export class LLMService {
  private openai: OpenAI;
  private gemini: GoogleGenerativeAI;
  private currentProvider: LLMProvider;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.currentProvider = process.env.INITIAL_PROVIDER as LLMProvider;
  }

  setProvider(provider: LLMProvider) {
    this.currentProvider = provider;
  }

  // Not used right now
  async generateResponse(messages: ChatMessage[]): Promise<string> {
    if (this.currentProvider === SupportedLLMProvider.OPENAI) {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL!,
        messages: messages.map(
          (m) =>
            ({
              role: m.role === "operator" ? "user" : m.role,
              content: m.content,
            }) as const,
        ),
      });
      return response.choices[0].message.content || "";
    } else {
      const model = this.gemini.getGenerativeModel({
        model: process.env.GEMINI_MODEL!,
      });
      const chat = model.startChat({
        history: messages.map((m) => ({
          role: m.role === "assistant" ? "model" : m.role,
          parts: [{ text: m.content }],
        })),
      });
      const result = await chat.sendMessage(
        messages[messages.length - 1].content,
      );
      return result.response.text();
    }
  }

  async *openAiStream(messages: ChatMessage[]): AsyncGenerator<string> {
    const stream = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL!,
      messages: messages.map(
        (m) =>
          ({
            role: m.role === "operator" ? "user" : m.role,
            content: m.content,
          }) as const,
      ),
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  async *geminiAiStream(messages: ChatMessage[]): AsyncGenerator<string> {
    const model = this.gemini.getGenerativeModel({
      model: process.env.GEMINI_MODEL!,
    });
    const chat = model.startChat({
      history: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : m.role,
        parts: [{ text: m.content }],
      })),
    });

    const result = await chat.sendMessageStream(
      messages[messages.length - 1].content,
    );
    for await (const chunk of result.stream) {
      const content = chunk.text();
      if (content) {
        yield content;
      }
    }
  }

  async *generateResponseStream(
    messages: ChatMessage[],
  ): AsyncGenerator<string> {
    if (this.currentProvider === SupportedLLMProvider.OPENAI) {
      yield* this.openAiStream(messages);
    } else {
      yield* this.geminiAiStream(messages);
    }
  }

  async handleLLMResponse(client: Client, messages: ChatMessage[]) {
    try {
      // Send a start marker
      client.ws.send(
        JSON.stringify({
          type: MessageType.STREAM_START,
          message: { role: "assistant", content: "" },
        }),
      );

      let fullResponse = "";
      for await (const chunk of this.generateResponseStream(messages)) {
        fullResponse += chunk;
        // Send each chunk to the client
        client.ws.send(
          JSON.stringify({
            type: MessageType.STREAM_CHUNK,
            chunk,
          }),
        );
      }

      // Send the complete message for history
      const aiMessage: ChatMessage = {
        role: "assistant",
        content: fullResponse,
      };
      client.chatHistory.push(aiMessage);

      // Send end marker
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
