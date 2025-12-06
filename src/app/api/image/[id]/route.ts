import { NextRequest, NextResponse } from 'next/server';
import { getImageById } from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const imageId = params.id;
    
    if (!imageId) {
      return NextResponse.json({ error: 'Image ID required' }, { status: 400 });
    }

    const image = await getImageById(imageId);
    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const response = new NextResponse(image.data);
    response.headers.set('Content-Type', image.mimeType || 'image/jpeg');
    response.headers.set('Cache-Control', 'public, max-age=31536000');
    return response;

  } catch (error) {
    console.error('Image retrieval error:', error);
    return NextResponse.json({ error: 'Failed to retrieve image' }, { status: 500 });
  }
}
