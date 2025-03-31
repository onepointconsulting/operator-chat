import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

import WebSocket from "ws";
import readline from "readline";
import { Command, MessageSubtype, MessageType } from "./enums";
import { isCommand, getCommand, getArgs, logCommonCommands } from "./commands";
import { Config } from "./config";
import { setupDisconnectHandlers } from "./disconnectHandlers";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const url = `ws://${Config.SERVER}:${Config.PORT}`;
console.info(`Connecting to ${url}`);

const ws = new WebSocket(url);
setupDisconnectHandlers(ws, rl);

function messagePrompt() {
  rl.question('Enter message (or "/quit" to exit): ', askMessage);
}

let clientId = "";

// Read client ID from file clientId.txt
if (fs.existsSync("clientId.txt")) {
  clientId = fs.readFileSync("clientId.txt", "utf8");
}

function askMessage(input: string) {
  if (isCommand(input)) {
    const command = getCommand(input);
    const args = getArgs(input, command);

    switch (command) {
      case MessageType.QUIT:
        ws.close();
        rl.close();
        process.exit(0);

      case MessageType.LIST_OPERATORS:
        ws.send(JSON.stringify({ type: MessageType.LIST_OPERATORS }));
        break;

      case MessageType.SET_NAME:
        ws.send(JSON.stringify({ type: MessageType.SET_NAME, name: args[0] }));
        break;

      case MessageType.DISCONNECT:
        ws.send(JSON.stringify({ type: MessageType.DISCONNECT }));
        break;

      case MessageType.REQUEST_CLIENT_ID:
        ws.send(JSON.stringify({ type: MessageType.REQUEST_CLIENT_ID }));
        break;

      case MessageType.CONNECT:
        ws.send(
          JSON.stringify({ type: MessageType.CONNECT, targetId: args[0] }),
        );
        break;

      case Command.HELP:
        showCommands();
        messagePrompt();
        break;

      default:
        console.error(`Unrecognized command: ${command}`);
        messagePrompt();
    }
  } else {
    ws.send(
      JSON.stringify({ type: MessageType.MESSAGE, content: input, clientId }),
    );
  }
}

ws.on("open", () => {
  console.log("Connected to server");
  showCommands();
});

ws.on("message", (data) => {
  const message = JSON.parse(data.toString());

  switch (message.type) {
    case MessageType.STREAM_START:
      process.stdout.write("Assistant: ");
      break;

    case MessageType.STREAM_CHUNK:
      process.stdout.write(message.chunk);
      break;

    case MessageType.STREAM_END:
      process.stdout.write("\n\n");
      if (message.subType === MessageSubtype.STREAM_END_ERROR) {
        console.error("Error:", message.message);
      }
      messagePrompt();
      break;

    case MessageType.MESSAGE:
      if (message.subType === MessageSubtype.OPERATOR_DISCONNECTED) {
        console.log("Disconnected");
      } else {
        if (message.message) {
          console.log(`\n${message.message.role}: ${message.message.content}`);
        } else {
          console.log("Server:", message);
        }
      }
      messagePrompt();
      break;

    case MessageType.MESSAGE_SENT:
      messagePrompt();
      break;

    case MessageType.LIST_OPERATORS:
      console.log("Operators:");
      for (const operator of message.operators) {
        console.log(`  ${operator.id}: ${operator.name ?? "Anonymous"}`);
      }
      messagePrompt();
      break;

    case MessageType.SET_NAME:
      console.log(`${message.clientId} is now known as ${message.name}`);
      messagePrompt();
      break;

    case MessageType.CONNECTED:
      console.log(`Connected to ${message.targetId}`);
      messagePrompt();
      break;

    case MessageType.CONVERSATION_ID:
      console.log(`Conversation ID: ${message.conversationId}`);
      messagePrompt();
      break;

    case MessageType.CLIENT_ID:
      clientId = message.clientId;
      fs.writeFileSync("clientId.txt", message.clientId);
      messagePrompt();
      break;

    case MessageType.ERROR:
      console.error("Error:", message.message);
      messagePrompt();
      break;
  }
});

function showCommands() {
  console.log("\nCommands:");
  console.log(`/${MessageType.LIST_OPERATORS} - List available operators`);
  console.log(`/${MessageType.CONNECT} <userId> - Connect to an operator`);
  console.log(
    `/${MessageType.DISCONNECT} - Disconnect from the current operator`,
  );
  console.log(`/${MessageType.REQUEST_CLIENT_ID} - Request a client ID`);
  console.log(`/${Command.HELP} - Show the help menu`);
  logCommonCommands();
  console.log("Any other input will be sent as a message\n");
  rl.question("Enter command or message: ", askMessage);
}
