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

function askMessage(answer: string) {
  if (answer.toLowerCase() === 'quit') {
    ws.close();
    rl.close();
    process.exit(0);
  }
  ws.send(JSON.stringify({ type: MessageType.MESSAGE, content: answer }));
}

ws.on('open', () => {
  console.log('Connected to server');
  
  rl.question('Enter message (or "quit" to exit): ', askMessage);
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  
  switch (message.type) {
    case MessageType.STREAM_START:
      process.stdout.write('Assistant: ');
      break;

    case MessageType.STREAM_CHUNK:
      process.stdout.write(message.chunk);
      break;

    case MessageType.STREAM_END:
      process.stdout.write('\n\n');
      rl.question('Enter message (or "quit" to exit): ', askMessage);
      break;

    case MessageType.MESSAGE:
      if (message.message) {
        console.log(`${message.message.role}: ${message.message.content}`);
      } else {
        console.log('Server:', message);
      }
      break;

    case MessageType.ERROR:
      console.error('Error:', message.message);
      break;
  }
}); 