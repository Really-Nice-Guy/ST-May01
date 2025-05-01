import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Parse request body for article ID and text
  const { id, text } = await req.json();

  // Retrieve Eleven Labs API credentials from environment
  const apiKey = process.env.ELEVEN_LABS_API_KEY;
  // Use provided preset voice ID if no environment variable is set
  const voiceId = process.env.ELEVEN_LABS_VOICE_ID || 'khVCkwSTjNQ8vAvDc1cG';

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing Eleven Labs credentials' }, { status: 500 });
  }

  // Call Eleven Labs text-to-speech endpoint
  const elevenRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({ text })
    }
  );

  if (!elevenRes.ok) {
    const errorText = await elevenRes.text();
    console.error('Eleven Labs error:', errorText);
    return NextResponse.json({ error: 'Failed to generate audio' }, { status: elevenRes.status });
  }

  // Stream audio buffer back to client
  const arrayBuffer = await elevenRes.arrayBuffer();
  return new NextResponse(arrayBuffer, {
    headers: { 'Content-Type': 'audio/mpeg' }
  });
} 