import { embed, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import { db } from '../db';
import { asc, cosineDistance, desc, gt, lt, sql } from 'drizzle-orm';
import { embeddings } from '../db/schema/embeddings';

const embeddingModel = openai.embedding('text-embedding-ada-002');

const generateWordChunks = (
    input: string,
    chunkSize: number = 100,
    overlap: number = 20
): string[] => {
    // Split the input into words using any whitespace as a delimiter.
    const words = input.trim().split(/\s+/);
    const chunks: string[] = [];

    let startIndex = 0;
    while (startIndex < words.length) {
        // Extract a slice of words for the current chunk.
        const chunkWords = words.slice(startIndex, startIndex + chunkSize);
        // Join the words back into a string.
        chunks.push(chunkWords.join(' '));
        // Advance the start index by chunkSize minus the overlap.
        startIndex += chunkSize - overlap;
    }

    return chunks;
};
function cleanContent(raw: string): string {
    // Remove page break markers like: "----------------Page (12) Break----------------"
    let cleaned = raw.replace(/-+\s*Page\s*\(\d+\)\s*Break\s*-+/gi, '');
    // Optionally remove other unwanted patterns (e.g., stray symbols) here
    // Remove multiple newlines and trim whitespace
    cleaned = cleaned.replace(/\n\s*\n/g, '\n').trim();
    return cleaned;
}

export const generateEmbeddings = async (
    value: string,
): Promise<Array<{ embedding: number[]; content: string }>> => {
    const chunks = generateWordChunks(value, 150, 20);
    const { embeddings } = await embedMany({
        model: embeddingModel,
        values: chunks,
    });
    return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
};

// Function to generate embeddings for the user's query
export const generateEmbedding = async (value: string): Promise<number[]> => {
    const input = value.replaceAll('\\n', ' ');
    const { embedding } = await embed({
        model: embeddingModel,
        value: input,
    });
    return embedding;
};


// Fetch embeddings from the database and compute similarity for the user's query
export const findRelevantContent = async (userQuery: string): Promise<string> => {
    try {
        // Generate embedding for the user's query
        const userQueryEmbedded = await generateEmbedding(userQuery);
        console.log("User query embedding:", userQueryEmbedded);

        // Fetch all embeddings from the database
        const allEmbeddings = await db
            .select({ id: embeddings.id, content: embeddings.content, embedding: embeddings.embedding })
            .from(embeddings);
        console.log("Database embeddings:", allEmbeddings.map(i => i.embedding));

        // Compute cosine similarity for each embedding stored in the database.
        // NOTE: Adjust the function usage if cosineDistance returns a distance (where lower is more similar)
        // and ensure that lt and asc are imported from your query builder library.
        const relevantContentResults = await db
            .select({
                content: embeddings.content,
                similarity: cosineDistance(embeddings.embedding, userQueryEmbedded)
            })
            .from(embeddings)
            .where(lt(cosineDistance(embeddings.embedding, userQueryEmbedded), 0.5)) // Lower distance indicates more similarity
            .orderBy(t => asc(t.similarity)) // Order by lower (more similar) distance first
            .limit(4);

        console.log("Relevant content results from DB:", relevantContentResults);

        if (!relevantContentResults || relevantContentResults.length === 0) {
            // Return a default message if no content is found.
            return "Sorry, I don't know.";
        }
        // Join the content parts and clean the combined string
        const rawContent = relevantContentResults.map(i => i.content).join("\n");
        const cleanedContent = cleanContent(rawContent);
        return cleanedContent;
    } catch (error) {
        console.error("Error in findRelevantContent:", error);
        return "Error retrieving relevant content.";
    }
};
