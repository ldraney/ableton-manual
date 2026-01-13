# ableton-manual-mcp

MCP server with RAG for the Ableton Live 12 manual. Provides semantic search over the full manual.

## Setup

```bash
npm install
npm run build
npm run build-index  # Generate embeddings (first time only)
```

## Usage

Add to your Claude Code MCP config:

```json
{
  "mcpServers": {
    "ableton-manual": {
      "command": "node",
      "args": ["C:/Users/drane/ableton-manual/dist/index.js"]
    }
  }
}
```

## Tools

- `search_manual` - Search the manual for relevant sections

## How it works

1. Manual is chunked by H2 sections (~300 chunks)
2. Each chunk is embedded using `all-MiniLM-L6-v2` (local, no API key needed)
3. Queries are embedded and matched via cosine similarity
4. Top results returned with chapter/section context
