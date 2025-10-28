// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Brak pliku w polu 'file'" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type" },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name || `upload_${Date.now()}`;

    const metadata = {
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
    };

    // Save to MongoDB
    const imageId = await uploadImage(buffer, filename, metadata);
    console.log("MongoDB upload successful, imageId:", imageId);

    return NextResponse.json({ 
      success: true, 
      imageId: imageId.toString(),
      url: `/api/images/${imageId}`,
      filename,
      message: 'Image uploaded successfully to database'
    });
  } catch (e: any) {
    console.error("[api/upload] błąd:", e);
    return NextResponse.json(
      { error: e.message || "Nieznany błąd" },
      { status: 500 }
    );
  }
}
