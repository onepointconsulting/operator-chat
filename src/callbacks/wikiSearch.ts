import { ChatMessage } from "../types";

function enhanceSearchResult(searchResult: any[]): string {
  return `
  ${searchResult.map((result) => {
    return `
    Title: ${result.title}
    Snippet: ${result.snippet}
    Page ID: ${result.pageid}
    English URL: https://en.wikipedia.org/wiki?curid=${result.pageid}

    `
  }).join("\n")}
  `
}


export async function wikiSearch(chatHistory: ChatMessage[]): Promise<ChatMessage[]> {
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
    const enhancedSearchResult = enhanceSearchResult(data.query.search);
    // Manipulate the last message to include the Wikipedia information
    lastMessage.content = `${lastMessage.content}

Here is some extra information about the topic from Wikipedia which you can use to answer the user's question:

${enhancedSearchResult}

Please use this information to answer the user's question and give references to the sources.
`
  }
  return chatHistory;
} 