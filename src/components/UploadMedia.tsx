"use client";
import React from 'react'
import { getStorachaClient, toGatewayUrl } from '../lib/storacha'

type Uploaded = { name: string; url: string; cid: string; type: string }

export default function UploadMedia({ onUploaded }: { onUploaded: (files: Uploaded[]) => void }) {
  const [files, setFiles] = React.useState<File[]>([])
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(e.target.files || []))
  }

  const upload = async () => {
    setBusy(true); setError(null)
    try {
      const total = files.reduce((a, f) => a + f.size, 0)
      if (total > 300 * 1024 * 1024) throw new Error('Łączny rozmiar > 300MB')

      const client = await getStorachaClient()
      const withNames = files.map((f, i) => (f.name ? f : new File([f], `file-${i}`)))
      const cid = await client.uploadDirectory(withNames)
      const out = withNames.map(f => ({
        name: f.name,
        cid,
        url: toGatewayUrl(cid, f.name),
        type: f.type
      }))
      onUploaded(out)
    } catch (e: any) {
      setError(e?.message || 'Upload nieudany')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <input type="file" accept="image/*,video/*" multiple onChange={onSelect} />
      <button disabled={busy || files.length === 0} onClick={upload}>
        {busy ? 'Wysyłanie…' : `Wyślij ${files.length} plik(i)`}
      </button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  )
}