"use client";
import React from 'react'
import UploadMedia from '../../components/UploadMedia'

export default function MediaTestPage() {
  const [uploaded, setUploaded] = React.useState<{ name: string; url: string; type: string }[]>([])
  return (
    <div style={{ padding: 24 }}>
      <h1>Test uploadu (Storacha)</h1>
      <UploadMedia onUploaded={(f) => setUploaded(prev => [...prev, ...f])} />
      <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
        {uploaded.map((f, i) => (
          <div key={i}>
            <div>{f.name}</div>
            {f.type.startsWith('image/') ? (
              <img src={f.url} alt={f.name} style={{ maxWidth: 400 }} />
            ) : (
              <video controls src={f.url} style={{ maxWidth: 400 }} />
            )}
            <div style={{ fontSize: 12, wordBreak: 'break-all' }}>{f.url}</div>
          </div>
        ))}
      </div>
    </div>
  )
}