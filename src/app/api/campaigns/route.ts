import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/mongodb';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    
    // Get campaigns metadata from MongoDB
    const campaigns = await db.collection('campaigns').find({}).toArray();
    
    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { campaignId, title, description, imageUrl } = await request.json();
    
    if (!campaignId || !title || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    const campaignData = {
      campaignId,
      title,
      description,
      imageUrl,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('campaigns').updateOne(
      { campaignId },
      { $set: campaignData },
      { upsert: true }
    );
    
    return NextResponse.json({ success: true, campaign: campaignData });
  } catch (error) {
    console.error('Error saving campaign:', error);
    return NextResponse.json({ error: 'Failed to save campaign' }, { status: 500 });
  }
}
