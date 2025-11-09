// frontend/src/pages/ExpensesPage.jsx
import React, { useMemo, useRef, useState } from 'react'
import Section from '../components/Section'
import Table from '../components/Table'
import Modal from '../components/Modal'
import ActionMenu from '../components/ActionMenu'
import { readExcelRows, mapRowByAliases, exportRowsToExcel } from "../lib/excel"

const K = n => `KSh ${Number(n).toLocaleString('en-KE')}`

const INIT = [
  { id: 1, name: 'Rent',       date: '2025-02-01', amount: 50000, type: 'Fixed',    note: '' },
  { id: 2, name: 'Packaging',  date: '2025-02-03', amount: 3800,  type: 'Variable', note: '' },
  { id: 3, name: 'Delivery',   date: '2025-02-04', amount: 2100,  type: 'Variable', note: '' },
]

const EXPENSE_ALIASES = {
  name: ["name", "expense", "expense name"],
  date: ["date", "tx date", "expense date"],
  amount: ["amount", "value", "cost"],
  type: ["type", "category", "kind"],
  note: ["note", "description", "details"],
  id: ["id", "key"],
}

export default function ExpensesPage() {
  const [rows, setRows]   = useState(INIT)
  const [from, setFrom]   = useState('')
  const [to, setTo]       = useState('')
  const [modal, setModal] = useState({ open:false, edit:null })
  const fileRef = useRef(null)

  const filt = useMemo(()=>rows.filter(r=>{
    if (from && r.date < from) return false
    if (to   && r.date > to)   return false
    return true
  }), [rows,from,to])

  const total = useMemo(()=>filt.reduce((s,r)=>s+Number(r.amount||0),0), [filt])

  const columns = [
    { key:'name',   title:'Name' },
    { key:'date',   title:'Date' },
    { key:'amount', title:'Amount', render:r=>K(r.amount) },
    { key:'type',   title:'Type' },
    { key:'note',   title:'Note' },
  ]

  const exportExcel = () => exportRowsToExcel(filt, [
    {key:'name', title:'Name'},
    {key:'date', title:'Date'},
    {key:'amount', title:'Amount'},
    {key:'type', title:'Type'},
    {key:'note', title:'Note'},
  ], "expenses.xlsx")

  function addNew(){
    setModal({
      open: true,
      edit: { id: Date.now(), name:'', date: new Date().toISOString().slice(0,10), amount:0, type:'Variable', note:'' }
    })
  }

  function save(item){
    setRows(prev=>{
      const ex = prev.some(p=>p.id===item.id)
      return ex ? prev.map(p=>p.id===item.id? item : p) : [item, ...prev]
    })
    setModal({open:false, edit:null})
  }

  async function onImportExcel(e){
    const f = e.target.files?.[0]
    if (!f) return
    try {
      const rowsX = await readExcelRows(f)
      const norm = rowsX.map(r => mapRowByAliases(r, EXPENSE_ALIASES)).map(r => ({
        id: r.id || Date.now() + Math.random(),
        name: r.name || "",
        date: String(r.date || "").slice(0,10),
        amount: Number(r.amount || 0),
        type: r.type || "Variable",
        note: r.note || "",
      }))
      setRows(prev => [...norm, ...prev])
      e.target.value = ""
      alert("Imported Excel successfully into Expenses.")
    } catch (err) {
      console.error(err)
      alert("Failed to import Excel: " + err.message)
    }
  }

  return (
    <div className="space-y-6">
      <Section
        title="Expenses"
        actions={
          <div className="flex gap-2">
            <input type="date" className="rounded-xl border border-line px-3 py-2" value={from} onChange={e=>setFrom(e.target.value)} />
            <input type="date" className="rounded-xl border border-line px-3 py-2" value={to}   onChange={e=>setTo(e.target.value)} />
            <button className="btn" onClick={()=>{setFrom(''); setTo('')}}>Clear</button>
            <button className="btn btn-primary" onClick={addNew}>Add Expense</button>

            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={onImportExcel}
            />
            <button className="btn" onClick={()=>fileRef.current?.click()}>Import Excel</button>
            <ActionMenu label="Export" options={[{ label: 'Excel', onClick: exportExcel }]} />
          </div>
        }
      >
        <Table columns={[...columns, {key:'__actions', title:'Actions', render:r=>(
          <div className="flex gap-2">
            <button className="btn" onClick={()=>setModal({open:true, edit:{...r}})}>Edit</button>
            <button className="btn" onClick={()=>setRows(rows.filter(x=>x.id!==r.id))}>Delete</button>
          </div>
        )}]} data={filt} />
        <div className="text-right mt-2 text-sm text-mute">Total: <strong>{K(total)}</strong></div>
      </Section>

      <Modal open={modal.open} onClose={()=>setModal({open:false, edit:null})} title={modal.edit?'Edit Expense':'Add Expense'}>
        {modal.edit && (
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="block text-mute mb-1">Name</span>
              <input className="border border-line rounded-xl px-3 py-2 w-full"
                     value={modal.edit.name}
                     onChange={e=>setModal(m=>({...m, edit:{...m.edit, name:e.target.value}}))}/>
            </label>

            <label className="text-sm">
              <span className="block text-mute mb-1">Date</span>
              <input type="date" className="border border-line rounded-xl px-3 py-2 w-full"
                     value={modal.edit.date}
                     onChange={e=>setModal(m=>({...m, edit:{...m.edit, date:e.target.value}}))}/>
            </label>

            <label className="text-sm">
              <span className="block text-mute mb-1">Amount</span>
              <input className="border border-line rounded-xl px-3 py-2 w-full"
                     value={modal.edit.amount}
                     onChange={e=>setModal(m=>({...m, edit:{...m.edit, amount:e.target.value}}))}/>
            </label>

            <label className="text-sm">
              <span className="block text-mute mb-1">Type</span>
              <select className="border border-line rounded-xl px-3 py-2 w-full"
                      value={modal.edit.type}
                      onChange={e=>setModal(m=>({...m, edit:{...m.edit, type:e.target.value}}))}>
                <option>Fixed</option>
                <option>Variable</option>
              </select>
            </label>

            <label className="col-span-2 text-sm">
              <span className="block text-mute mb-1">Description</span>
              <input className="border border-line rounded-xl px-3 py-2 w-full"
                     placeholder="Optional note"
                     value={modal.edit.note}
                     onChange={e=>setModal(m=>({...m, edit:{...m.edit, note:e.target.value}}))}/>
            </label>
          </div>
        )}
      </Modal>
    </div>
  )
}
