import { NextRequest } from 'next/server';
import * as Client from '@storacha/client';
import { StoreMemory } from '@storacha/client/stores/memory';
import * as Proof from '@storacha/client/proof';
import { Signer } from '@storacha/client/principal/ed25519';
import * as DID from '@ipld/dag-ucan/did';

const KEY = process.env.STORACHA_KEY!;
const PROOF = process.env.STORACHA_PROOF!;
const SPACE_DID = process.env.NEXT_PUBLIC_SPACE_DID;

type RouteCtx = { params: Promise<{ did: string }> };

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    if (!KEY || !PROOF) return new Response('Server not configured', { status: 500 });

    const { did } = await ctx.params;            // <-- ważne
    const audience = DID.parse(did);

    const principal = Signer.parse(KEY);
    const store = new StoreMemory();
    const client = await Client.create({ principal, store });

    const proof = await Proof.parse(PROOF);
    const space = await client.addSpace(proof);
    await client.setCurrentSpace(space.did());

    if (SPACE_DID && SPACE_DID !== space.did()) {
      console.warn('SPACE_DID mismatch. Using proof space:', space.did());
    }

    const abilities: Client.ServiceAbility[] = [
      'space/blob/add', 'space/index/add', 'filecoin/offer', 'upload/add',
    ];
    const expiration = Math.floor(Date.now() / 1000) + 60 * 60;
    const delegation = await client.createDelegation(audience, abilities, { expiration });
    const archive = await delegation.archive();

    return new Response(archive.ok, {
      status: 200,
      headers: { 'content-type': 'application/octet-stream' },
    });
  } catch (e) {
    console.error('delegation error', e);
    return new Response('Delegation failed', { status: 500 });
  }
}