import { NextRequest, NextResponse } from "next/server";
import { linkImageToCampaign } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, imageId, uploadedBy, isPrimary } = body;

    if (!campaignId || !imageId || !uploadedBy) {
      return NextResponse.json(
        { error: "Missing required fields: campaignId, imageId, uploadedBy" },
        { status: 400 }
      );
    }

    const linkId = await linkImageToCampaign(
      imageId,
      campaignId,
      uploadedBy,
      Boolean(isPrimary)
    );

    return NextResponse.json({
      success: true,
      linkId,
      message: "Image linked to campaign successfully"
    });
  } catch (error: any) {
    console.error("Error linking image to campaign:", error);
    return NextResponse.json(
      { error: error.message || "Failed to link image to campaign" },
      { status: 500 }
    );
  }
}
