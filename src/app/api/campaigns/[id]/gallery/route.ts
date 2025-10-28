import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { db } = await connectToDatabase();
    const resolvedParams = await params;
    const campaignId = resolvedParams.id;

    console.log('🖼️ Fetching gallery for campaign ID:', campaignId);

    const campaign = await db
      .collection('campaigns')
      .findOne({ campaignId: campaignId });

    if (!campaign) {
      console.log('❌ Campaign not found for ID:', campaignId);
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const gallery = campaign.gallery || [];
    console.log('✅ Gallery found:', gallery.length, 'images');
    
    // Log each image URL for debugging
    gallery.forEach((img: any, idx: number) => {
      console.log(`📷 Gallery image ${idx + 1}:`, img.imageUrl);
    });

    return NextResponse.json({
      gallery: gallery,
      campaignId: campaign.campaignId
    });

  } catch (error) {
    console.error('❌ Error fetching campaign gallery:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
