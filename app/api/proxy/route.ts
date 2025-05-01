import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');
  if (!targetUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  // Fetch the external page server-side
  const fetched = await fetch(targetUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await fetched.text();

  // Return the HTML and allow embedding by overriding frame options
  const response = new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html'
    }
  });

  // Remove frame-busting
  response.headers.set('X-Frame-Options', 'ALLOWALL');
  response.headers.set('Content-Security-Policy', "frame-ancestors 'self' *");

  return response;
} 