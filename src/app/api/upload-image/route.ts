import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Walidacja
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    // Generuj unikalną nazwę
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2);
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}-${randomStr}.${extension}`;

    // Zapisz plik na dysku
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Zapisz metadane w bazie
    const { db } = await connectToDatabase();
    const imageRecord = {
      imageId: `${timestamp}-${randomStr}`,
      filename,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
      uploadedAt: new Date(),
    };

    await db.collection('images').insertOne(imageRecord);

    const imageUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      imageId: imageRecord.imageId,
      imageUrl,
      filename,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
