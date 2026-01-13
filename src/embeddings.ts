import { pipeline, type FeatureExtractionPipeline } from "@xenova/transformers";

let extractor: FeatureExtractionPipeline | null = null;

/**
 * Initialize the embedding model (downloads on first run ~23MB)
 */
export async function initEmbeddings(): Promise<void> {
  if (!extractor) {
    console.error("Loading embedding model...");
    extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
    console.error("Embedding model loaded.");
  }
}

/**
 * Generate embedding for a single text
 */
export async function embed(text: string): Promise<number[]> {
  if (!extractor) {
    await initEmbeddings();
  }

  const output = await extractor!(text, {
    pooling: "mean",
    normalize: true,
  });

  // Convert Float32Array to regular array
  return Array.from(output.data as Float32Array);
}

/**
 * Generate embeddings for multiple texts
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i++) {
    if (i % 10 === 0) {
      console.error(`Embedding ${i + 1}/${texts.length}...`);
    }
    embeddings.push(await embed(texts[i]));
  }

  return embeddings;
}
