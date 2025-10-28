import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  console.log('🔍 Fetching campaign metadata for ID:', id);

  if (!id) {
    return NextResponse.json(
      { error: 'Campaign ID is required' },
      { status: 400 }
    );
  }

  try {
    const { db } = await connectToDatabase();
    
    const campaign = await db.collection('campaigns').findOne({
      campaignId: String(id)
    });

    if (!campaign) {
      console.log('📭 Campaign not found in database:', id);
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    console.log('✅ Campaign metadata found:', {
      campaignId: campaign.campaignId,
      title: campaign.title,
      hasImage: !!campaign.imageUrl
    });

    return NextResponse.json({
      campaignId: campaign.campaignId,
      title: campaign.title,
      description: campaign.description,
      imageUrl: campaign.imageUrl,
      location: campaign.location,
      creator: campaign.creator,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt
    });

  } catch (error) {
    console.error('❌ Error fetching campaign metadata:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  try {
    const body = await request.json();
    const { title, description, imageUrl, location } = body;

    const { db } = await connectToDatabase();
    
    const updateData: any = {
      updatedAt: new Date()
    };

    if (title !== undefined) updateData.title = String(title).trim();
    if (description !== undefined) updateData.description = String(description).trim();
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (location !== undefined) updateData.location = location;

    const result = await db.collection('campaigns').updateOne(
      { campaignId: String(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    console.log('✅ Campaign metadata updated:', { campaignId: id, modified: result.modifiedCount > 0 });

    return NextResponse.json({
      success: true,
      campaignId: String(id),
      message: 'Campaign updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating campaign metadata:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
