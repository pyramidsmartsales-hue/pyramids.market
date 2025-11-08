import React, { useEffect, useMemo, useState } from 'react'
import Section from '../components/Section'
import Table from '../components/Table'
import ActionMenu from '../components/ActionMenu'
import { loadClients, saveClients } from '../lib/store'

export default function ClientsPage() {
  const [rows, setRows]   = useState(loadClients())
  const [q, setQ]         = useState('')
  const [csvText, setCsv] = useState('')

  // keep in sync with localStorage (e.g., from POS confirm)
  useEffect(()=>{ setRows(loadClients()) }, [])

  const filtered = useMemo(
    ()=>rows.filter(r => r.name.toLowerCase().includes(q.toLowerCase()) || r.phone.includes(q)),
    [rows, q]
  )

  const columns = [
    { key: 'name',      title: 'Name' },
    { key: 'phone',     title: 'Phone' },
    { key: 'orders',    title: 'Orders' },
    { key: 'lastOrder', title: 'Last Order' },
    { key: 'points',    title: 'Loyalty Points', render: r => (
      <div className="flex items-center gap-2">
        <span>{r.points}</span>
        <button className="btn" onClick={()=>updatePoints(r.id, +10)}>+10</button>
        <button className="btn" onClick={()=>updatePoints(r.id, -10)}>-10</button>
      </div>
    )},
  ]

  function updatePoints(id, delta){
    const next = rows.map(x => x.id===id ? {...x, points: Math.max(0, (x.points||0)+delta)} : x)
    setRows(next); saveClients(next)
  }

  // Export
  function exportCSV(){
    const header = ['name','phone','orders','lastOrder','points']
    const csv = header.join(',')+'\n'+filtered.map(r=>header.map(h=>r[h]).join(',')).join('\n')
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='clients.csv'; a.click(); URL.revokeObjectURL(url)
  }
  const exportPDF   = () => alert('PDF export placeholder')
  const exportExcel = () => alert('Excel export placeholder')

  // Import
  function importCSVFromText(){
    try{
      const lines = csvText.trim().split('\n')
      const header = lines[0].split(',').map(s=>s.trim())
      const items = lines.slice(1).map((line,i)=>{
        const cells = line.split(',').map(s=>s.trim())
        const obj = {}; header.forEach((h,idx)=>obj[h]=cells[idx])
        obj.id = Date.now()+i
        obj.orders = +obj.orders; obj.points = +obj.points
        return obj
      })
      const next = [...items, ...rows]
      setRows(next); saveClients(next); setCsv('')
      alert('Imported!')
    }catch(e){ alert('CSV parse error') }
  }
  const importPDF   = () => alert('PDF import placeholder')
  const importExcel = () => alert('Excel import placeholder')

  return (
    <div className="space-y-6">
      <Section
        title="Clients"
        actions={
          <div className="flex gap-2">
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search client..." className="rounded-xl border border-line px-3 py-2" />
            <ActionMenu label="Export" options={[
              { label: 'CSV', onClick: exportCSV },
              { label: 'PDF', onClick: exportPDF },
              { label: 'Excel', onClick: exportExcel },
            ]}/>
            <ActionMenu label="Import" options={[
              { label: 'CSV (paste)', onClick: ()=>document.getElementById('csvBox-clients').scrollIntoView({behavior:'smooth'}) },
              { label: 'PDF', onClick: importPDF },
              { label: 'Excel', onClick: importExcel },
            ]}/>
          </div>
        }
      >
        <Table columns={columns} data={filtered} />
      </Section>

      <Section title="Client Purchases (demo)">
        <div className="text-mute">Purchase history UI placeholder — to connect with backend later.</div>
      </Section>

      {/* CSV paste box */}
      <div className="mt-4" id="csvBox-clients">
        <details>
          <summary className="cursor-pointer text-sm text-mute">Import CSV (paste content)</summary>
        <textarea value={csvText} onChange={e=>setCsv(e.target.value)} rows={4} className="w-full border border-line rounded-xl p-2 mt-2" placeholder="name,phone,orders,lastOrder,points&#10;John,+2547...,3,2025-02-01,50" />
          <button className="btn mt-2" onClick={importCSVFromText}>Import</button>
        </details>
      </div>
    </div>
  )
}
