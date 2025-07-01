// src/app/api/upload/route.ts
import { NextResponse } from "next/server";
import { create, type Client } from "@web3-storage/w3up-client";
import { Signer } from "@web3-storage/w3up-client/principal/ed25519";
import * as Proof from "@web3-storage/w3up-client/proof";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file") as Blob;
    if (!file) {
      return NextResponse.json(
        { error: "Brak pliku w polu ‘file’" },
        { status: 400 }
      );
    }

    // 1) Inicjalizacja klienta
    const principal = Signer.parse(process.env.STORACHA_KEY!);
    const client: Client = await create({ principal });

    const proof = await Proof.parse(process.env.STORACHA_PROOF!);
    await client.addSpace(proof);
    await client.setCurrentSpace(process.env.NEXT_PUBLIC_SPACE_DID!);

    // 2) Upload pliku z nazwą
    const filename = (file as any).name || "upload";
    const fileWithName = new File([file], filename);

    const cid = await client.uploadFile(fileWithName);

    return NextResponse.json({ cid });
  } catch (e: any) {
    console.error("[api/upload] błąd:", e);
    return NextResponse.json(
      { error: e.message || "Nieznany błąd" },
      { status: 500 }
    );
  }
}
