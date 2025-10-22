export const DEFAULT_GATEWAY = 'https://ipfs.io/ipfs/';

export function toGatewayUrl(input?: string | null, gw = DEFAULT_GATEWAY): string {
  if (!input) return '';
  const val = String(input).trim();
  if (!val) return '';
  if (val.startsWith('http://') || val.startsWith('https://')) return val;
  if (val.startsWith('ipfs://')) return gw + val.replace('ipfs://', '');
  if (val.startsWith('ipfs/')) return gw + val.slice(5);
  return gw + val;
}

export async function fetchMetadataByCid(cid: string, gw = DEFAULT_GATEWAY): Promise<any | null> {
  const clean = (cid || '').trim();
  if (!clean) return null;
  const tryUrls = [
    gw + clean,
    gw + clean + '/metadata.json',
  ];
  for (const url of tryUrls) {
    try {
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) continue;
      const ct = r.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await r.json();
    } catch {}
  }
  return null;
}
