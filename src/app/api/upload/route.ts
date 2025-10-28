// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../lib/mongodb";
import { GridFSBucket } from "mongodb";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  console.log("📤 Upload request received");

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.log("❌ No file provided");
      return NextResponse.json(
        { error: "Brak pliku w polu 'file'" },
        { status: 400 }
      );
    }

    console.log("📁 File details:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    if (!validTypes.includes(file.type)) {
      console.log("❌ Invalid file type:", file.type);
      return NextResponse.json(
        { error: "Nieprawidłowy typ pliku. Dozwolone: JPG, PNG, WebP" },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      console.log("❌ File too large:", file.size);
      return NextResponse.json(
        { error: "Plik jest za duży. Maksymalny rozmiar: 5MB" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const bucket = new GridFSBucket(db, { bucketName: "images" });

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `campaign_${timestamp}_${file.name}`;

    console.log("💾 Uploading to GridFS:", filename);

    // Upload to GridFS
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        contentType: file.type,
        originalName: file.name,
        uploadedAt: new Date(),
        size: file.size,
      },
    });

    return new Promise((resolve, reject) => {
      uploadStream.on("finish", () => {
        const imageUrl = `/api/images/${uploadStream.id}`;
        console.log("✅ Upload successful:", {
          id: uploadStream.id.toString(),
          filename,
          imageUrl,
        });

        resolve(
          NextResponse.json({
            success: true,
            url: imageUrl,
            imageUrl: imageUrl,
            filename: filename,
            id: uploadStream.id.toString(),
          })
        );
      });

      uploadStream.on("error", (error) => {
        console.error("❌ GridFS upload error:", error);
        resolve(
          NextResponse.json(
            { error: "Błąd uploadu do bazy danych" },
            { status: 500 }
          )
        );
      });

      uploadStream.end(buffer);
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    return NextResponse.json(
      { error: "Błąd serwera podczas uploadu" },
      { status: 500 }
    );
  }
}
