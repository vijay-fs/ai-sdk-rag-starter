import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { findRelevantContent } from '@/lib/ai/embedding';

export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();
        console.log("Incoming messages:", messages);

        const result = streamText({
            model: openai('gpt-4o'),
            messages,
            system: `You are a helpful assistant. Before answering, please call the "getInformation" tool to retrieve relevant knowledge base content.
Only use information from that tool call. If no relevant information is found, respond with "Sorry, I don't know."`,
            tools: {
                getInformation: tool({
                    description: `Retrieve information from the knowledge base.`,
                    parameters: z.object({
                        question: z.string().describe('The user’s question'),
                    }),
                    execute: async ({ question }) => {
                        try {
                            const relevantContent = await findRelevantContent(question);
                            console.log("Tool execution: relevantContent =", relevantContent);
                            return relevantContent || "No relevant information found.";
                        } catch (error) {
                            console.error("Error in getInformation tool execution:", error);
                            return "Error retrieving relevant information.";
                        }
                    },
                }),
            },
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error("Error in POST handler:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
