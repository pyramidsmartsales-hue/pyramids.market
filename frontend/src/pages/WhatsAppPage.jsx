import React, { useMemo, useState } from 'react'
import Section from '../components/Section'

const CLIENTS = [
  { id: 1, name: 'Mohamed Adel', phone: '+254700000001' },
  { id: 2, name: 'Sara Nabil', phone: '+254700000002' },
  { id: 3, name: 'Omar Ali', phone: '+254700000003' },
]

function StatusDot({ connected }) {
  return (
    <span
      title={connected ? 'WhatsApp Connected' : 'WhatsApp Disconnected'}
      className={`inline-block w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}
    />
  )
}

// توليد "QR" تجريبي: نص يغيّر نفسه ويمكن عرضه كمحتوى أو استبداله لاحقًا بصورة QR فعلية
function generateQRToken() {
  return 'QR-' + Math.random().toString(36).slice(2).toUpperCase()
}

export default function WhatsAppPage() {
  const [connected, setConnected] = useState(false)
  const [message, setMessage] = useState('')
  const [file, setFile] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [qrCode, setQrCode] = useState('')

  const allIds = useMemo(()=>CLIENTS.map(c=>c.id), [])
  const allSelected = selectedIds.length === allIds.length
  const noneSelected = selectedIds.length === 0

  function toggleAll() {
    setSelectedIds(allSelected ? [] : allIds)
  }
  function toggleOne(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  }

  function send() {
    const to = CLIENTS.filter(c=>selectedIds.includes(c.id)).map(c=>c.phone).join(', ')
    alert(`(Demo) Sending to: ${to || 'No selection'}\n\n${message}${file ? '\n[with image]' : ''}`)
  }

  function generateQR() {
    setQrCode(generateQRToken())
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Clients with checkboxes + select all */}
      <Section title="Clients" actions={
        <div className="flex items-center gap-3">
          <button className="btn" onClick={toggleAll}>{allSelected ? 'Unselect All' : 'Select All'}</button>
          <div className="flex items-center gap-2">
            <StatusDot connected={connected} />
            <span className="text-sm text-mute">{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      }>
        <ul className="space-y-2">
          {CLIENTS.map(c => (
            <li key={c.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedIds.includes(c.id)}
                onChange={()=>toggleOne(c.id)}
              />
              <button
                className={`flex-1 text-left rounded-xl px-3 py-2 border ${selectedIds.includes(c.id) ? 'bg-base border-line' : 'border-line hover:bg-base'}`}
                onClick={()=>toggleOne(c.id)}
              >
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-mute">{c.phone}</div>
              </button>
            </li>
          ))}
        </ul>
      </Section>

      {/* Composer */}
      <Section title="Compose message">
        <div className="space-y-3">
          <div className="text-sm text-mute">To: <span className="font-medium text-ink">
            {noneSelected ? 'No clients selected' : `${selectedIds.length} clients selected`}
          </span></div>
          <textarea
            className="w-full rounded-xl border border-line p-3"
            rows={6}
            placeholder="Write your message..."
            value={message}
            onChange={e=>setMessage(e.target.value)}
          />
          <input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0] ?? null)} />
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={send}>Send</button>
            <button className="btn" onClick={()=>{setMessage(''); setFile(null)}}>Clear</button>
          </div>
        </div>
      </Section>

      {/* QR (generate latest) + toggle connection */}
      <Section
        title="WhatsApp Link Code"
        actions={
          <div className="flex gap-2">
            <button className="btn" onClick={()=>setConnected(v=>!v)}>{connected ? 'Go Offline' : 'Go Online'}</button>
            <button className="btn btn-primary" onClick={generateQR}>Generate Latest QR</button>
          </div>
        }
      >
        <div className="grid place-items-center h-64">
          {qrCode ? (
            <div className="bg-base border border-line rounded-xl p-6 text-center">
              <div className="text-sm text-mute mb-2">Scan this code:</div>
              <div className="text-xl font-semibold">{qrCode}</div>
            </div>
          ) : (
            <div className="text-mute">No QR generated yet</div>
          )}
        </div>
        <p className="text-sm text-mute">Use the latest code to link the device. (Placeholder — integrate with your WhatsApp provider.)</p>
      </Section>
    </div>
  )
}
