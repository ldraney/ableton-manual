import { readFileSync } from "fs";
import { join } from "path";

export interface Chunk {
  id: string;
  chapter: string;
  section: string;
  content: string;
}

/**
 * Split markdown into chunks by H2 sections.
 * Each chunk contains the section content with chapter context.
 */
export function chunkMarkdown(filePath: string): Chunk[] {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const chunks: Chunk[] = [];

  let currentChapter = "";
  let currentSection = "";
  let currentContent: string[] = [];
  let chunkId = 0;

  function saveChunk() {
    if (currentSection && currentContent.length > 0) {
      const text = currentContent.join("\n").trim();
      if (text.length > 50) {
        // Skip very short chunks
        chunks.push({
          id: `chunk-${chunkId++}`,
          chapter: currentChapter,
          section: currentSection,
          content: text,
        });
      }
    }
    currentContent = [];
  }

  for (const line of lines) {
    // Match chapter headers: # 1. Chapter Title
    const chapterMatch = line.match(/^# (\d+\.?\s*.+)$/);
    if (chapterMatch) {
      saveChunk();
      currentChapter = chapterMatch[1].trim();
      currentSection = currentChapter;
      continue;
    }

    // Match section headers: ## 1.1 Section Title
    const sectionMatch = line.match(/^## (.+)$/);
    if (sectionMatch) {
      saveChunk();
      currentSection = sectionMatch[1].trim();
      continue;
    }

    // Match subsection headers: ### 1.1.1 Subsection Title
    // Include these in the content but don't split on them
    currentContent.push(line);
  }

  // Save the last chunk
  saveChunk();

  return chunks;
}

/**
 * Load chunks from the manual file
 */
export function loadManualChunks(): Chunk[] {
  const manualPath = join(
    process.cwd(),
    "manual",
    "Ableton_Live_12-en.md"
  );
  return chunkMarkdown(manualPath);
}
