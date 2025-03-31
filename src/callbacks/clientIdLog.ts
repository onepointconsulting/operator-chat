import { Conversation } from "../types";

export async function clientIdLog(conversation: Conversation): Promise<void> {
  console.log(`Client ID: ${conversation.clientId}`);
}
