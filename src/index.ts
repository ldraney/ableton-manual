#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { loadIndex, search, getChapters } from "./vectordb.js";
import { embed, initEmbeddings } from "./embeddings.js";

const server = new Server(
  {
    name: "ableton-manual",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_manual",
        description:
          "Search the Ableton Live 12 manual for relevant sections. Use this to find information about Ableton concepts, features, devices, and workflows.",
        inputSchema: {
          type: "object" as const,
          properties: {
            query: {
              type: "string",
              description: "What to search for in the manual",
            },
            limit: {
              type: "number",
              description: "Maximum number of results to return (default 5)",
            },
          },
          required: ["query"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "search_manual") {
    const { query, limit = 5 } = request.params.arguments as {
      query: string;
      limit?: number;
    };

    try {
      const queryEmbedding = await embed(query);
      const results = search(queryEmbedding, limit);

      const formatted = results
        .map(
          (r, i) =>
            `## Result ${i + 1} (score: ${r.score.toFixed(3)})\n` +
            `**Chapter:** ${r.chunk.chapter}\n` +
            `**Section:** ${r.chunk.section}\n\n` +
            `${r.chunk.content.slice(0, 1500)}${r.chunk.content.length > 1500 ? "..." : ""}`
        )
        .join("\n\n---\n\n");

      return {
        content: [
          {
            type: "text",
            text: formatted,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error searching manual: ${error}`,
          },
        ],
        isError: true,
      };
    }
  }

  return {
    content: [{ type: "text", text: `Unknown tool: ${request.params.name}` }],
    isError: true,
  };
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "manual://chapters",
        name: "Manual Chapters",
        description: "List of all chapters in the Ableton Live 12 manual",
        mimeType: "text/plain",
      },
    ],
  };
});

// Read resources
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === "manual://chapters") {
    const chapters = getChapters();
    return {
      contents: [
        {
          uri: "manual://chapters",
          mimeType: "text/plain",
          text: chapters.join("\n"),
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${request.params.uri}`);
});

async function main() {
  // Load the vector index
  const loaded = loadIndex();
  if (!loaded) {
    console.error("Failed to load index. Run 'npm run build-index' first.");
    process.exit(1);
  }

  // Initialize embeddings model
  await initEmbeddings();

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Ableton Manual MCP server running on stdio");
}

main().catch(console.error);
