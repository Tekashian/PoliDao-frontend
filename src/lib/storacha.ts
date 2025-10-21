import * as Client from '@storacha/client'
import * as Delegation from '@storacha/client/delegation'

let cached: Client.Client | null = null

export async function getStorachaClient(): Promise<Client.Client> {
  if (cached) return cached
  const client = await Client.create()
  const did = client.agent.did()

  const res = await fetch(`/api/storacha-delegation/${encodeURIComponent(did)}`)
  if (!res.ok) throw new Error(`Delegation fetch failed: ${res.status}`)
  const buf = new Uint8Array(await res.arrayBuffer())

  const delegation = await Delegation.extract(buf)
  if (!delegation.ok) throw new Error('Delegation extract failed')

  const space = await client.addSpace(delegation.ok)
  await client.setCurrentSpace(space.did())

  cached = client
  return client
}

export function toGatewayUrl(cid: string, name?: string) {
  return name
    ? `https://${cid}.ipfs.storacha.link/${encodeURIComponent(name)}`
    : `https://${cid}.ipfs.storacha.link`
}