# WebSocket Chat Server with LLM Integration

A TypeScript-based WebSocket server that enables chat functionality with both AI language models (ChatGPT and Gemini) and human operators. The system allows users to chat with AI models when no operator is available, and seamlessly switch to human operator support when needed.

## Features

- Real-time chat using WebSocket connections
- Support for multiple AI providers:
  - OpenAI's ChatGPT
  - Google's Gemini
- Human operator integration:
  - Secure operator authentication
  - One-to-one chat sessions between operators and users
  - Operator can only chat with one user at a time
- Automatic fallback to AI when no operator is available
- Command-line interfaces for both users and operators
- Written in TypeScript for better type safety and developer experience

## Prerequisites

- Node.js (v16 or higher)
- Yarn package manager
- OpenAI API key
- Google Gemini API key

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/chat-websocket-server.git
cd chat-websocket-server
```

2. Install dependencies:

```bash
yarn install
```

3. Create a `.env` file in the root directory with the following variables:

```bash
OPENAI_API_KEY=<key>
OPENAI_MODEL=gpt-4o-mini
INITIAL_PROVIDER=openai
GEMINI_API_KEY=<key>

OPERATOR_PASSWORD=<password>
PORT=<port>
```

## Usage

1. Start the server:

```bash
yarn start
```

2. Start the operator client:

```bash
yarn operator
```

Operator Commands:
- `/connect <userId>` - Connect to a specific user
- `/disconnect` - Disconnect from the current user
- `/quit` - Exit the operator interface
- Any other input will be sent as a message to the connected user

3. Start the user client:

```bash
yarn client
```





