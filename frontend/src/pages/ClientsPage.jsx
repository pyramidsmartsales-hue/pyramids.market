// frontend/src/pages/ClientsPage.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import Section from '../components/Section'
import Table from '../components/Table'
import ActionMenu from '../components/ActionMenu'
import { loadClients, saveClients } from '../lib/store'
import { readExcelRows, mapRowByAliases } from "../lib/excel"

const CLIENT_ALIASES = {
  id: ["id", "clientid", "key"],
  name: ["name", "client", "customer", "client name"],
  phone: ["phone", "mobile", "msisdn", "tel"],
  orders: ["orders", "ordercount", "total orders"],
  lastOrder: ["lastorder", "last order", "lastorderdate"],
  points: ["points", "loyalty", "score"],
}

export default function ClientsPage() {
  const [rows, setRows] = useState(loadClients())
  const [q, setQ]       = useState('')
  const fileRef = useRef(null)

  useEffect(()=>{ setRows(loadClients()) }, [])

  const filtered = useMemo(
    ()=>rows.filter(r => (r.name || "").toLowerCase().includes(q.toLowerCase()) || (r.phone || "").includes(q)),
    [rows, q]
  )

  const columns = [
    { key: 'name',   title: 'Name' },
    { key: 'phone',  title: 'Phone' },
    { key: 'orders', title: 'Orders' },
    { key: 'lastOrder', title: 'Last Order' },
    { key: 'points', title: 'Points' },
    { key: 'x',       title: 'Actions', render: r => (
      <div className="flex gap-2">
        <button className="btn" onClick={()=>editRow(r)}>Edit</button>
        <button className="btn" onClick={()=>removeRow(r.id)}>Delete</button>
      </div>
    )},
  ]

  function editRow(r){
    // existing edit handler (kept as placeholder)
    alert("Edit client not yet wired in this patch: " + (r.name || r.id));
  }

  function removeRow(id){
    const next = rows.filter(x=>x.id!==id)
    setRows(next)
    saveClients(next)
  }

  const exportExcel = () => alert('Excel export placeholder')

  async function onImportExcel(e){
    const f = e.target.files?.[0]
    if (!f) return
    try {
      const rowsX = await readExcelRows(f)
      const norm = rowsX.map(r => mapRowByAliases(r, CLIENT_ALIASES)).map(r => ({
        id: r.id || String(Date.now() + Math.random()),
        name: r.name || "",
        phone: String(r.phone || ""),
        orders: Number(r.orders || 0),
        lastOrder: String(r.lastOrder || ""),
        points: Number(r.points || 0),
      }))
      // Merge by phone if present, else by id
      setRows(prev => {
        const byKey = Object.create(null)
        for (const p of prev) {
          const key = (p.phone && p.phone.trim()) ? ("phone:" + p.phone.trim()) : ("id:" + (p.id || ""))
          byKey[key] = p
        }
        for (const n of norm) {
          const k = (n.phone && n.phone.trim()) ? ("phone:" + n.phone.trim()) : ("id:" + (n.id || ""))
          byKey[k] = { ...(byKey[k] || {}), ...n }
        }
        const next = Object.values(byKey)
        saveClients(next)
        return next
      })
      e.target.value = ""
      alert("Imported Excel successfully into Clients.")
    } catch (err) {
      console.error(err)
      alert("Failed to import Excel: " + err.message)
    }
  }

  return (
    <div className="space-y-6">
      <Section
        title="Clients"
        actions={
          <div className="flex items-center gap-2">
            <input className="border border-line rounded-xl px-3 py-2" placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)} />
            <ActionMenu label="Export" options={[{ label: 'Excel', onClick: exportExcel }]} />
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={onImportExcel}
            />
            <button className="btn" onClick={()=>fileRef.current?.click()}>Import Excel</button>
          </div>
        }
      >
        <Table columns={columns} data={filtered} />
      </Section>

      <Section title="Loyalty & Notes">
        <div className="text-mute">Purchase history UI placeholder — to connect with backend later.</div>
      </Section>
    </div>
  )
}
