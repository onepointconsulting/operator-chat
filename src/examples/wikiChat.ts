import { initChatServer } from "../main";
import { ChatCallback } from "../callback";

var WIKI_API_URL = "https://en.wikipedia.org/w/api.php";

/**
 * This is a simple example of a chat callback.
 * It will log the chat history to the console.
 */
initChatServer([
  new ChatCallback("wikiChat", async (chatHistory) => {
    const lastMessage = chatHistory.slice(-1)[0];

    const url = "https://en.wikipedia.org/w/api.php"

    const params = new URLSearchParams({
        action: "query",
        list: "search",
        srsearch: lastMessage.content,
        format: "json"
    });

    const response = await fetch(`${url}?${params}`);
    if (!response.ok) {
        const text = await response.text();
        console.error(text);
        return chatHistory;
    }
    const data = await response.json();
    if (data.query.search) {
        // Manipulate the last message to include the Wikipedia information
        lastMessage.content = `${lastMessage.content}

Here is some extra information about the topic from Wikipedia which you can use to answer the user's question:
\`\`\`json
${JSON.stringify(data.query.search)}
\`\`\`

Please use this information to answer the user's question and give references to the sources.
`
    }
    return chatHistory;
  }),
]);
