import { NextRequest, NextResponse } from 'next/server';
import { getImage, getImageMetadata } from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const imageId = params.id;
    
    if (!imageId) {
      return NextResponse.json({ error: 'Image ID required' }, { status: 400 });
    }

    const metadata = await getImageMetadata(imageId);
    if (!metadata) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const downloadStream = await getImage(imageId);
    
    const chunks: Buffer[] = [];
    
    return new Promise((resolve, reject) => {
      downloadStream.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      downloadStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const response = new NextResponse(buffer);
        response.headers.set('Content-Type', metadata.metadata?.mimeType || 'image/jpeg');
        response.headers.set('Cache-Control', 'public, max-age=31536000');
        resolve(response);
      });
      
      downloadStream.on('error', () => {
        resolve(NextResponse.json({ error: 'Failed to retrieve image' }, { status: 500 }));
      });
    });

  } catch (error) {
    console.error('Image retrieval error:', error);
    return NextResponse.json({ error: 'Failed to retrieve image' }, { status: 500 });
  }
}
