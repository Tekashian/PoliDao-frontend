import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../lib/mongodb";
import { GridFSBucket, ObjectId } from "mongodb";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { db } = await connectToDatabase();
    const resolvedParams = await params;
    const bucket = new GridFSBucket(db, { bucketName: "images" });

    console.log("🖼️ Serving image ID:", resolvedParams.id);

    const fileId = new ObjectId(resolvedParams.id);

    // Check if file exists
    const files = await bucket.find({ _id: fileId }).toArray();
    if (files.length === 0) {
      console.log("❌ Image not found:", resolvedParams.id);
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const file = files[0];
    console.log("✅ Image found:", file.filename);

    // Create download stream
    const downloadStream = bucket.openDownloadStream(fileId);

    // Convert stream to buffer
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      downloadStream.on("data", (chunk) => {
        chunks.push(chunk);
      });

      downloadStream.on("end", () => {
        const buffer = Buffer.concat(chunks);

        const response = new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type": file.metadata?.contentType || "image/jpeg",
            "Content-Length": buffer.length.toString(),
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });

        resolve(response);
      });

      downloadStream.on("error", (error) => {
        console.error("❌ Download stream error:", error);
        resolve(
          NextResponse.json(
            { error: "Error downloading image" },
            { status: 500 }
          )
        );
      });
    });
  } catch (error) {
    console.error("❌ Image serve error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
