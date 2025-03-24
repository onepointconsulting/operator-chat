import path from "path";
import { Conversation } from "../types";
import fs from "fs";

const FILE_PATH = path.join(
  __dirname,
  `./chatHistory_${new Date().toISOString().replace(/[:Z]/g, "")}.json`,
);

export async function fileSaver(conversation: Conversation): Promise<void> {
  const { id, chatHistory } = conversation;
  const message = { id, chatHistory, timestamp: new Date().toISOString() };
  // Append to the file
  fs.appendFileSync(FILE_PATH, JSON.stringify(message) + "\n");
}
