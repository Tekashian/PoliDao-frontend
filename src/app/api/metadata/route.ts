// src/app/api/metadata/route.ts
import { NextResponse } from 'next/server';
import { create, type Client } from '@web3-storage/w3up-client';
import { Signer } from '@web3-storage/w3up-client/principal/ed25519';
import * as Proof from '@web3-storage/w3up-client/proof';

export const runtime = 'nodejs';

/**
 * POST /api/metadata
 * Body: JSON metadata object { title, description, category, beneficiaryType, contactInfo, location, ... }
 * Returns: { cid }
 */
export async function POST(request: Request) {
  try {
    const json = await request.json();
    if (!json || typeof json !== 'object') {
      return NextResponse.json({ error: 'Brak poprawnego JSON' }, { status: 400 });
    }

    // Minimalna walidacja
    if (!json.title || !json.description) {
      return NextResponse.json({ error: 'title i description są wymagane' }, { status: 400 });
    }

    // Inicjalizacja klienta w3up
    const principalKey = process.env.STORACHA_KEY;
    const proofVal = process.env.STORACHA_PROOF;
    const spaceDid = process.env.NEXT_PUBLIC_SPACE_DID;
    if (!principalKey || !proofVal || !spaceDid) {
      return NextResponse.json({ error: 'Brak konfiguracji STORACHA_* w env' }, { status: 500 });
    }

    const principal = Signer.parse(principalKey);
    const client: Client = await create({ principal });
    const proof = await Proof.parse(proofVal);
    await client.addSpace(proof);
  await client.setCurrentSpace(spaceDid as `did:${string}:${string}`);

    const enriched = {
      ...json,
      createdAt: Date.now(),
      version: 1,
    };

    const blob = new Blob([JSON.stringify(enriched, null, 2)], { type: 'application/json' });
    const file = new File([blob], 'metadata.json', { type: 'application/json' });
    const cid = await client.uploadFile(file);

    return NextResponse.json({ cid });
  } catch (e: any) {
    console.error('[api/metadata] error', e);
    return NextResponse.json({ error: e.message || 'Nieznany błąd' }, { status: 500 });
  }
}
