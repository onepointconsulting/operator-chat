import dotenv from 'dotenv';
dotenv.config();

import WebSocket from 'ws';
import readline from 'readline';
import { MessageType } from './enums';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ws = new WebSocket(`ws://localhost:${process.env.PORT}`);

function authenticateOperator() {
  rl.question('Enter operator password: ', (password) => {
    ws.send(JSON.stringify({ type: 'auth', password }));
  });
}

ws.on('open', () => {
  console.log('Connected to server');
  authenticateOperator();
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());

  switch (message.type) {

    case MessageType.LOGIN_RESPONSE:
      if (message.success) {
        console.log('Authentication successful');
        showCommands();
      } else {
        console.log('Authentication failed');
        authenticateOperator();
      }
      break;
      
    case MessageType.MESSAGE:
      console.log('Server:', message);
      break;

    case MessageType.ERROR:
      console.error('Error:', message.message);
      break;

    case MessageType.CONNECTED:
      console.log(`Connected to user ${message.targetId}`);
      break;

    default:
      console.log('Server:', message);
  }
  rl.question('Enter command or message: ', askMessage);
});

function askMessage(input: string) {
  if (input.startsWith('/')) {
    const [command, ...args] = input.slice(1).split(' ');

    switch (command) {
      case MessageType.CONNECT:
        ws.send(JSON.stringify({ type: 'connect', targetId: args[0] }));
        break;
      case MessageType.DISCONNECT:
        ws.send(JSON.stringify({ type: 'disconnect' }));
        break;
      case MessageType.QUIT:
        ws.close();
        rl.close();
        process.exit(0);
    }
  } else {
    ws.send(JSON.stringify({ type: MessageType.MESSAGE, content: input }));
  }
}

function showCommands() {
  console.log('\nCommands:');
  console.log('/connect <userId> - Connect to a user');
  console.log('/disconnect - Disconnect from current user');
  console.log('/quit - Exit the program');
  console.log('Any other input will be sent as a message\n');

  rl.question('Enter command or message: ', askMessage);
} 