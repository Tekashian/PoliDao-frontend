import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../../lib/mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { db } = await connectToDatabase();
    const resolvedParams = await params;
    const campaignId = resolvedParams.id;

    console.log("📡 Fetching image for campaign ID:", campaignId);

    // Find campaign and return imageUrl
    const campaign = await db
      .collection("campaigns")
      .findOne({ campaignId: campaignId });

    console.log("🔍 Campaign found:", campaign ? "Yes" : "No");
    if (campaign) {
      console.log("🖼️ Image URL:", campaign.imageUrl || "None");
    }

    if (!campaign) {
      console.log("❌ Campaign not found for ID:", campaignId);
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({
      imageUrl: campaign.imageUrl || null,
      campaignId: campaign.campaignId,
    });
  } catch (error) {
    console.error("❌ Error fetching campaign images:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
