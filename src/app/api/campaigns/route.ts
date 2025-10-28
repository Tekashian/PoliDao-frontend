import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    
    const { campaignId, title, description, imageUrl, location, creator } = body;

    console.log('📝 Storing campaign metadata:', {
      campaignId,
      title,
      hasImageUrl: !!imageUrl,
      imageUrl: imageUrl || 'None'
    });

    if (!campaignId || !title || !creator) {
      return NextResponse.json(
        { error: 'Missing required fields: campaignId, title, creator' },
        { status: 400 }
      );
    }

    // Check if campaign already exists
    const existingCampaign = await db
      .collection('campaigns')
      .findOne({ campaignId: campaignId.toString() });

    if (existingCampaign) {
      console.log('🔄 Updating existing campaign:', campaignId);
      // Update existing campaign with new data including image
      const result = await db
        .collection('campaigns')
        .updateOne(
          { campaignId: campaignId.toString() },
          {
            $set: {
              title,
              description,
              imageUrl: imageUrl || null,
              location: location || null,
              creator: creator.toLowerCase(),
              updatedAt: new Date()
            }
          }
        );

      console.log('✅ Campaign updated successfully');
      return NextResponse.json({
        success: true,
        updated: true,
        campaignId: campaignId.toString()
      });
    }

    // Create new campaign
    console.log('🆕 Creating new campaign:', campaignId);
    const result = await db.collection('campaigns').insertOne({
      campaignId: campaignId.toString(),
      title,
      description,
      imageUrl: imageUrl || null,
      location: location || null,
      creator: creator.toLowerCase(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Campaign created successfully with image URL:', imageUrl || 'None');
    return NextResponse.json({
      success: true,
      created: true,
      campaignId: campaignId.toString(),
      insertedId: result.insertedId
    });

  } catch (error) {
    console.error('❌ Error in campaigns API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (campaignId) {
      // Get specific campaign
      const campaign = await db
        .collection('campaigns')
        .findOne({ campaignId: campaignId.toString() });

      if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }

      return NextResponse.json(campaign);
    }

    // Get all campaigns
    const campaigns = await db
      .collection('campaigns')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(campaigns);

  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
