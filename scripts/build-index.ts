#!/usr/bin/env node

import { loadManualChunks } from "../src/chunker.js";
import { embedBatch, initEmbeddings } from "../src/embeddings.js";
import { saveIndex, type IndexedChunk } from "../src/vectordb.js";

async function main() {
  console.log("Building Ableton manual search index...\n");

  // Load and chunk the manual
  console.log("Loading manual...");
  const chunks = loadManualChunks();
  console.log(`Found ${chunks.length} chunks.\n`);

  // Show some stats
  const chapters = new Set(chunks.map((c) => c.chapter));
  console.log(`Chapters: ${chapters.size}`);
  console.log(`Average chunk size: ${Math.round(chunks.reduce((sum, c) => sum + c.content.length, 0) / chunks.length)} chars\n`);

  // Initialize embeddings model
  await initEmbeddings();

  // Generate embeddings
  console.log("\nGenerating embeddings...");
  const texts = chunks.map(
    (c) => `${c.chapter} - ${c.section}\n\n${c.content}`
  );
  const embeddings = await embedBatch(texts);

  // Create indexed chunks
  const indexedChunks: IndexedChunk[] = chunks.map((chunk, i) => ({
    ...chunk,
    embedding: embeddings[i],
  }));

  // Save to disk
  saveIndex(indexedChunks);

  console.log("\nDone! Index saved to data/embeddings.json");
}

main().catch(console.error);
