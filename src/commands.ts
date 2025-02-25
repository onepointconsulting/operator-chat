export function isCommand(message: string) {
  return message.startsWith('/');
}

export function getCommand(message: string) {
  return message.slice(1).split(' ')[0];
}
