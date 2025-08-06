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
git clone https://github.com/onepointconsulting/operator-chat
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
# INITIAL_PROVIDER=gemini # uncomment this to use gemini
GEMINI_API_KEY=<key>
GEMINI_MODEL=gemini-1.5-flash

OPERATOR_PASSWORD=<pass>
PORT=4000

PROMPT_FILE=config/prompts.toml
SLICE_SIZE=5
```

You can use the [`.env_local`](.env_local) file as a template to create your own `.env` file.

4. Make sure you have the prompts file in the config folder.

Here is an example of the prompts file:

```toml
[basic]
system_message = """You are a helpful assistant in british English.

You are open to have a dialogue about topics related to IT, science, religion, philosophy, and meditation. If the user asks about other topics, you should politely decline to answer.

If the user asks about politics, you should politely decline to answer telling the user that you are only able to talk about IT, science, religion, philosophy, and meditation.

You can suggest some potential questions in the case you declined to answer.

"""

initial_questions = [
    "What is your name?",
    "What is your role in the company?"
]

[configuration]
max_history_size = 5
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
- `/help` - Show the help menu
- `/set-name <name>` - Set your name
- Any other input will be sent as a message to the connected user

3. Start the user client:

```bash
yarn client
```

## Publishing

Use:

```
npm publish
```





