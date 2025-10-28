import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/mongodb';
import { GridFSBucket, ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const campaignId = resolvedParams.id;
    
    console.log('📤 Adding image to campaign:', campaignId);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const creator = formData.get('creator') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'Brak pliku w polu \'file\'' },
        { status: 400 }
      );
    }

    if (!creator) {
      return NextResponse.json(
        { error: 'Brak adresu twórcy' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Nieprawidłowy typ pliku. Dozwolone: JPG, PNG, WebP' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Plik jest za duży. Maksymalny rozmiar: 5MB' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Verify campaign exists and creator owns it
    const campaign = await db
      .collection('campaigns')
      .findOne({ campaignId: campaignId });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Kampania nie została znaleziona' },
        { status: 404 }
      );
    }

    if (campaign.creator.toLowerCase() !== creator.toLowerCase()) {
      return NextResponse.json(
        { error: 'Tylko twórca kampanii może dodawać zdjęcia' },
        { status: 403 }
      );
    }

    // Upload to GridFS
    const bucket = new GridFSBucket(db, { bucketName: 'images' });
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const timestamp = Date.now();
    const filename = `campaign_${campaignId}_gallery_${timestamp}_${file.name}`;

    console.log('💾 Uploading gallery image:', filename);

    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        contentType: file.type,
        originalName: file.name,
        uploadedAt: new Date(),
        size: file.size,
        campaignId: campaignId,
        type: 'gallery'
      }
    });

    return new Promise((resolve) => {
      uploadStream.on('finish', async () => {
        const imageUrl = `/api/images/${uploadStream.id}`;
        
        try {
          // Verify the image was uploaded correctly
          const uploadedFile = await db.collection('images.files').findOne({ _id: uploadStream.id });
          if (!uploadedFile) {
            console.error('❌ Uploaded file not found in GridFS:', uploadStream.id);
            resolve(NextResponse.json(
              { error: 'Upload verification failed' },
              { status: 500 }
            ));
            return;
          }

          console.log('✅ File uploaded to GridFS:', {
            id: uploadStream.id,
            filename: uploadedFile.filename,
            size: uploadedFile.length,
            contentType: uploadedFile.metadata?.contentType
          });

          // Add to campaign gallery
          const updateResult = await db
            .collection('campaigns')
            .updateOne(
              { campaignId: campaignId },
              { 
                $push: { 
                  gallery: {
                    imageUrl: imageUrl,
                    imageId: uploadStream.id.toString(),
                    filename: filename,
                    uploadedAt: new Date(),
                    originalName: file.name,
                    contentType: file.type,
                    size: file.size
                  }
                }
              }
            );

          if (updateResult.matchedCount === 0) {
            console.error('❌ Campaign not found for gallery update:', campaignId);
            resolve(NextResponse.json(
              { error: 'Campaign not found' },
              { status: 404 }
            ));
            return;
          }

          console.log('✅ Gallery image added successfully:', {
            campaignId,
            imageUrl,
            imageId: uploadStream.id.toString()
          });
          
          resolve(NextResponse.json({
            success: true,
            imageUrl: imageUrl,
            imageId: uploadStream.id.toString(),
            filename: filename
          }));
        } catch (dbError) {
          console.error('❌ Database update error:', dbError);
          resolve(NextResponse.json(
            { error: 'Błąd aktualizacji bazy danych' },
            { status: 500 }
          ));
        }
      });

      uploadStream.on('error', (error) => {
        console.error('❌ GridFS upload error:', error);
        resolve(NextResponse.json(
          { error: 'Błąd uploadu do bazy danych' },
          { status: 500 }
        ));
      });

      uploadStream.end(buffer);
    });

  } catch (error) {
    console.error('❌ Add image error:', error);
    return NextResponse.json(
      { error: 'Błąd serwera podczas uploadu' },
      { status: 500 }
    );
  }
}
