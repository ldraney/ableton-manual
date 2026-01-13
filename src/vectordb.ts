import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import type { Chunk } from "./chunker.js";

export interface IndexedChunk extends Chunk {
  embedding: number[];
}

export interface SearchResult {
  chunk: Chunk;
  score: number;
}

const DATA_PATH = join(process.cwd(), "data", "embeddings.json");

let index: IndexedChunk[] = [];

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] ** 2;
    magB += b[i] ** 2;
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Load the index from disk
 */
export function loadIndex(): boolean {
  if (!existsSync(DATA_PATH)) {
    console.error("No index found at", DATA_PATH);
    return false;
  }

  const data = readFileSync(DATA_PATH, "utf-8");
  index = JSON.parse(data);
  console.error(`Loaded ${index.length} chunks from index.`);
  return true;
}

/**
 * Save the index to disk
 */
export function saveIndex(chunks: IndexedChunk[]): void {
  index = chunks;
  writeFileSync(DATA_PATH, JSON.stringify(chunks, null, 2));
  console.error(`Saved ${chunks.length} chunks to index.`);
}

/**
 * Search for similar chunks
 */
export function search(
  queryEmbedding: number[],
  limit: number = 5
): SearchResult[] {
  if (index.length === 0) {
    throw new Error("Index not loaded. Call loadIndex() first.");
  }

  const results: SearchResult[] = index.map((chunk) => ({
    chunk: {
      id: chunk.id,
      chapter: chunk.chapter,
      section: chunk.section,
      content: chunk.content,
    },
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, limit);
}

/**
 * Get all chapter names
 */
export function getChapters(): string[] {
  const chapters = new Set<string>();
  for (const chunk of index) {
    chapters.add(chunk.chapter);
  }
  return Array.from(chapters);
}
