import { CoreMessage, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { findRelevantContent } from '@/lib/ai/embedding';

export async function POST(req: Request) {
    const { messages }: { messages: CoreMessage[] } = await req.json();

    // Extract last message
    const lastMessage = messages[messages.length - 1];

    // Ensure `content` is always a string
    let userQuery = '';
    if (typeof lastMessage.content === 'string') {
        userQuery = lastMessage.content;
    } else if (Array.isArray(lastMessage.content)) {
        userQuery = lastMessage.content
            .filter(part => part.type === 'text') // Keep only text parts
            .map(part => (part as any).text) // Extract text
            .join(' '); // Join multiple text parts
    } else {
        console.error('Invalid message format:', lastMessage.content);
        return new Response(JSON.stringify({ error: 'Invalid message format' }), { status: 400 });
    }

    console.log(userQuery, 'last message (cleaned)');

    // Fetch relevant content
    const sourceContent = await findRelevantContent(userQuery);
    console.log(sourceContent, 'source content');

    // If no relevant content found, return "Sorry, I don't know."
    if (!sourceContent || sourceContent.trim() === '') {
        return new Response(JSON.stringify({ messages: [{ role: 'assistant', content: "Sorry, I don't know." }] }));
    }

    // Stream AI response based ONLY on sourceContent
    const result = await streamText({
        model: openai('gpt-4'),
        system: `You are a helpful assistant. Only answer using the provided relevant information. If no relevant information is available, do not attempt to generate a response.`,
        messages: [
            ...messages,
            { role: 'system', content: `Relevant Information: ${sourceContent}` },
        ],
    });

    return result.toDataStreamResponse();
}
