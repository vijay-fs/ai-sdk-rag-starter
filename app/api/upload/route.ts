import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import PDFParser from 'pdf2json';
import { db } from '@/lib/db';
import { resources } from '@/lib/db/schema/resources';
import { generateEmbeddings } from '@/lib/ai/embedding';
import { embeddings as embeddingsTable } from '@/lib/db/schema/embeddings';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Generate a unique filename
        const fileName = uuidv4();
        const tempFilePath = `/tmp/${fileName}.pdf`;

        // Convert file to Buffer and save it temporarily
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        await fs.writeFile(tempFilePath, fileBuffer);

        // Parse PDF using pdf2json
        const content = await parsePdf(tempFilePath);

        if (!content) {
            return NextResponse.json({ error: 'Failed to extract text' }, { status: 400 });
        }

        // Insert content into the database
        const [resource] = await db.insert(resources).values({ content }).returning();

        // Generate and store embeddings
        const embeddings = await generateEmbeddings(content);
        await db.insert(embeddingsTable).values(
            embeddings.map(embedding => ({
                resourceId: resource.id,
                ...embedding,
            }))
        );

        // Cleanup: Delete the temporary file after processing
        await fs.unlink(tempFilePath);

        return NextResponse.json({ message: 'File uploaded and processed successfully' });
    } catch (error) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
    }
}

// Helper function to parse PDF using pdf2json
function parsePdf(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, true);

        pdfParser.on('pdfParser_dataError', (errData: any) => {
            console.error('PDF Parsing Error:', errData.parserError);
            reject(new Error('Error parsing PDF'));
        });

        pdfParser.on('pdfParser_dataReady', () => {
            const parsedText = (pdfParser as any).getRawTextContent().trim();
            resolve(parsedText);
        });

        pdfParser.loadPDF(filePath);
    });
}