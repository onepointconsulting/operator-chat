import { MessageType } from "./enums";

export function isCommand(message: string) {
  return message.startsWith("/");
}

export function getCommand(message: string) {
  return message.slice(1).split(" ")[0];
}

export function getArgs(input: string, command: string) {
  return input
    .slice(command.length + 1)
    .trim()
    .split(" ");
}

export function logCommonCommands() {
  console.log(`/${MessageType.SET_NAME} <name> - Set your name`);
  console.log(`/${MessageType.QUIT} - Exit the program`);
}
