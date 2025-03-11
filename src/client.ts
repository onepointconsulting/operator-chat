import dotenv from "dotenv";
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

const ws = new WebSocket(`ws://${Config.SERVER}:${Config.PORT}`);
setupDisconnectHandlers(ws, rl);

function messagePrompt() {
  rl.question('Enter message (or "/quit" to exit): ', askMessage);
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
    ws.send(JSON.stringify({ type: MessageType.MESSAGE, content: input }));
  }
}

ws.on("open", () => {
  console.log("Connected to server");
  showCommands();
  messagePrompt();
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
  console.log(`/${MessageType.DISCONNECT} - List available operators`);
  console.log(`/${Command.HELP} - Show the help menu`);
  logCommonCommands();
  console.log("Any other input will be sent as a message\n");
  rl.question("Enter command or message: ", askMessage);
}
