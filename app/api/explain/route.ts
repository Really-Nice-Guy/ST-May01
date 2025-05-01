import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { text } = await req.json();

  // Start streaming completion from OpenAI
  const completion = await client.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: `You are a helpful assistant that explains concepts in simple terms. 
        Explain the provided text as if you're explaining to a 5-year-old. Use simple words, clear analogies, 
        and keep your explanation concise.`},
      { role: 'user', content: `Please explain this in simple terms:\n\n"${text}"` }
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