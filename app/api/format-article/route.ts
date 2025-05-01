import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { text } = await req.json();

  // Start streaming completion from OpenAI
  const completion = await client.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: `You are an assistant that formats input into a well-structured article with headings and paragraphs. Make the heading h3. and date under heading,
         date should also follow heading. Use heading tags liberally. This is for a blog/article. Use italic for dates. If date is not available, use the current date which is ${new Date().toLocaleDateString()}. in text format and italic ofc. No words before date.
         DO NOT CHANGE ANY OF THE CONTENT.`},
      { role: 'user', content: `Format the following write-up into a well-structured article. DO NOT CHANGE ANY OF THE CONTENT:\n\n${text}` }
    ],
    stream: true,
  });

  // Create a Web ReadableStream to send SSE events
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const part of completion) {
          const json = JSON.stringify(part);
          controller.enqueue(encoder.encode(`data: ${json}\n\n`));
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
} 