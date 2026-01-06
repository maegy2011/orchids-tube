import { NextResponse } from 'next/server';
import { getYouTube } from '@/lib/youtube';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json([]);
  }

  try {
    const yt = await getYouTube();
    const suggestions = await yt.getSearchSuggestions(q);
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error fetching YouTube suggestions:', error);
    return NextResponse.json([], { status: 500 });
  }
}
