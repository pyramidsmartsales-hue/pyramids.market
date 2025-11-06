import React, { useEffect, useState, useRef } from 'react'
import api from '../api/api'

export default function ClientsPage(){
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [area, setArea] = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()

  async function fetchClients(){
    setLoading(true)
    try{
      const q = new URLSearchParams()
      if (search) q.set('search', search)
      if (area) q.set('area', area)
      const res = await api.get('/clients?' + q.toString())
      setClients(res.data.data || res.data)
    }catch(err){
      console.error(err)
      alert('فشل جلب العملاء')
    }finally{ setLoading(false) }
  }

  useEffect(()=>{ fetchClients() }, [])

  async function handleImport(e){
    const f = e.target.files[0]
    if (!f) return
    const fd = new FormData()
    fd.append('file', f)
    try{
      const res = await api.post('/clients/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      alert('تم الاستيراد: ' + res.data.created)
      fetchClients()
    }catch(err){
      console.error(err)
      alert('فشل الاستيراد')
    } finally {
      fileRef.current.value = null
    }
  }

  function exportCSV(){
    const url = (import.meta.env.VITE_API_URL || '/api') + '/clients/export/csv'
    window.open(url, '_blank')
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">العملاء — Clients</h2>

      <div className="mb-4 flex gap-2 items-center">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث بالاسم..." className="p-2 border rounded"/>
        <input value={area} onChange={e=>setArea(e.target.value)} placeholder="المنطقة..." className="p-2 border rounded"/>
        <button onClick={fetchClients} className="px-3 py-2 bg-pyramid-gold rounded text-white">بحث</button>
        <button onClick={exportCSV} className="px-3 py-2 border rounded">تصدير CSV</button>
        <label className="px-3 py-2 border rounded cursor-pointer">
          استيراد CSV
          <input ref={fileRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
        </label>
      </div>

      <div className="bg-white rounded shadow p-4">
        {loading ? <div>جارٍ التحميل...</div> :
          <table className="w-full table-auto">
            <thead><tr className="text-left"><th>الاسم</th><th>الهاتف</th><th>المنطقة</th><th>الوسوم</th></tr></thead>
            <tbody>
              {clients && clients.length ? clients.map(c=> (
                <tr key={c._id || c.id}><td>{c.name}</td><td>{c.phone}</td><td>{c.area}</td><td>{(c.tags||[]).join(', ')}</td></tr>
              )) : <tr><td colSpan="4">لا يوجد عملاء</td></tr>}
            </tbody>
          </table>
        }
      </div>
    </div>
  )
}
