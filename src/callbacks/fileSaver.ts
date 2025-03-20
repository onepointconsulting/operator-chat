import path from "path";
import { Client } from "../types";
import fs from 'fs';

const FILE_PATH = path.join(__dirname, `./chatHistory_${new Date().toISOString().replace(/[:Z]/g, '')}.json`);


export async function fileSaver(
    client: Client,
  ): Promise<void> {
    const { id, chatHistory } = client;
    const message = {id, chatHistory, timestamp: new Date().toISOString()};
    // Append to the file
    fs.appendFileSync(FILE_PATH, JSON.stringify(message) + "\n");
  }