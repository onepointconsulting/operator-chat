import dotenv from "dotenv";
dotenv.config();

import WebSocket from "ws";
import readline from "readline";
import { MessageSubtype, MessageType } from "./enums";
import { isCommand, getCommand, getArgs, logCommonCommands } from "./commands";
import { setupDisconnectHandlers } from "./disconnectHandlers";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ws = new WebSocket(`ws://localhost:${process.env.PORT}`);
setupDisconnectHandlers(ws, rl);

function authenticateOperator() {
  rl.question("Enter operator password: ", (password) => {
    ws.send(JSON.stringify({ type: "auth", password }));
  });
}

function messagePrompt() {
  rl.question('Enter message (or "/quit" to exit): ', askMessage);
}

ws.on("open", () => {
  console.log("Connected to server");
  authenticateOperator();
});

ws.on("message", (data) => {
  const message = JSON.parse(data.toString());

  switch (message.type) {
    case MessageType.LOGIN_RESPONSE:
      if (message.success) {
        console.log("Authentication successful");
        showCommands();
      } else {
        console.log("Authentication failed");
        authenticateOperator();
      }
      break;

    case MessageType.MESSAGE:
      const { clientId, subType } = message;
      if (subType) {
        switch (subType) {
          case MessageSubtype.OPERATOR_DISCONNECTED:
            console.log("Disconnected");
            break;
        }
      } else {
        console.log(`\n${clientId}: `, message.message?.content);
      }
      break;

    case MessageType.MESSAGE_SENT:
      messagePrompt();
      break;

    case MessageType.ERROR:
      console.error("Error:", message.message);
      break;

    case MessageType.CONNECTED:
      console.log(`Connected to user ${message.targetId}`);
      break;

    case MessageType.SET_NAME:
      console.log(`${message.clientId} is now known as ${message.name}`);
      break;

    case MessageType.USERS_LIST:
      const { users } = message;
      console.log("Available users:");
      for (const user of users) {
        console.log(
          "  ",
          user.id,
          " - ",
          user.isOperator ? "operator" : "normal user",
        );
      }
      break;

    default:
      console.log("Server:", message);
  }
  messagePrompt();
});

function askMessage(input: string) {
  if (isCommand(input)) {
    const command = getCommand(input);
    const args = getArgs(input, command);

    switch (command) {
      case MessageType.CONNECT:
        ws.send(
          JSON.stringify({ type: MessageType.CONNECT, targetId: args[0] }),
        );
        break;
      case MessageType.DISCONNECT:
        ws.send(JSON.stringify({ type: MessageType.DISCONNECT }));
        break;
      case MessageType.LIST_USERS:
        ws.send(JSON.stringify({ type: MessageType.LIST_USERS }));
        break;
      case MessageType.SET_NAME:
        ws.send(JSON.stringify({ type: MessageType.SET_NAME, name: args[0] }));
        break;
      case MessageType.QUIT:
        ws.close();
        rl.close();
        process.exit(0);
      default:
        console.error(`Unrecognized command: ${command}`);
        messagePrompt();
    }
  } else {
    ws.send(JSON.stringify({ type: MessageType.MESSAGE, content: input }));
  }
}

function showCommands() {
  console.log("\nCommands:");
  console.log(`/${MessageType.CONNECT} <userId> - Connect to a user`);
  console.log(`/${MessageType.DISCONNECT} - Disconnect from current user`);
  console.log(`/${MessageType.LIST_USERS} - List available users`);
  logCommonCommands();
  console.log("Any other input will be sent as a message\n");

  rl.question("Enter command or message: ", askMessage);
}
