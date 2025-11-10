import React, { useEffect, useMemo, useState } from 'react'
import Section from '../components/Section'

const API_ORIG = (import.meta.env.VITE_API_URL || "").replace(/\/+$/,"");
const API_BASE = API_ORIG.replace(/\/api$/,"");
const url = (p) => `${API_BASE}${p.startsWith('/') ? p : `/${p}`}`;

const fmt = n => `KSh ${Number(n||0).toLocaleString('en-KE',{maximumFractionDigits:2})}`

export default function POSPage(){
  const [products,setProducts] = useState([])
  const [clients,setClients]   = useState([])
  const [cart,setCart]         = useState([])
  const [client,setClient]     = useState(null)
  const [payment,setPayment]   = useState('Cash')
  const [q,setQ]               = useState('')

  async function load(){
    const p = await (await fetch(url('/api/products'))).json()
    setProducts(Array.isArray(p)?p:[])
    const c = await (await fetch(url('/api/clients'))).json()
    const list = Array.isArray(c) ? c : (Array.isArray(c?.rows)?c.rows: (Array.isArray(c?.data)?c.data:[]) )
    setClients(list)
  }
  useEffect(()=>{ load().catch(console.error) }, [])

  const filtered = useMemo(()=>{
    const s = q.trim().toLowerCase()
    return products.filter(p => 
      String(p.name||'').toLowerCase().includes(s) ||
      String(p.barcode||'').includes(s)
    )
  },[products,q])

  const total = useMemo(()=>cart.reduce((s,i)=>s + Number(i.salePrice||0)*Number(i.qty||0),0), [cart])

  function addToCart(p){
    setCart(prev=>{
      const ex = prev.find(x=>String(x.barcode)===String(p.barcode))
      if (ex) return prev.map(x=>x===ex? {...x, qty:(x.qty||0)+1} : x)
      return [...prev, {...p, qty:1}]
    })
  }
  function inc(it){ setCart(c=>c.map(x=>x===it? {...x, qty:(x.qty||0)+1} : x)) }
  function dec(it){ setCart(c=>c.map(x=>x===it? {...x, qty:Math.max(1,(x.qty||0)-1)} : x)) }
  function remove(it){ setCart(c=>c.filter(x=>x!==it)) }

  async function confirmPurchase(){
    if (!cart.length){ alert('Cart is empty'); return }
    const items = cart.map(i => ({
      barcode: i.barcode, name: i.name, qty: Number(i.qty||0),
      price: Number(i.salePrice||0), cost: Number(i.cost||0)
    }))
    const payload = {
      invoiceNo: `${Date.now()}`,
      clientName: client?.name || '',
      clientPhone: client?.phone || '',
      paymentMethod: payment || 'Cash',
      items,
      total,
      profit: items.reduce((s,i)=> s + (Number(i.price)-Number(i.cost))*Number(i.qty), 0)
    }
    try{
      const res = await fetch(url('/api/sales/google'), {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
      })
      if (!res.ok){
        const t = await res.text()
        throw new Error(t || `HTTP ${res.status}`)
      }
      alert([
        'Purchase confirmed.',
        `Client: ${payload.clientName||'—'}`,
        `Items: ${items.length}`,
        `Total: KSh ${total}`
      ].join('\n'))
      setCart([])
    }catch(e){
      alert('Failed to confirm purchase:\n' + e.message)
    }
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      <Section title="Product Search">
        <input className="border border-line rounded-xl px-3 py-2 w-full mb-3" placeholder="Search by name or barcode..." value={q} onChange={e=>setQ(e.target.value)} />
        <div className="space-y-2">
          {filtered.map(p=>(
            <button key={p.barcode} className="block w-full text-left border border-line rounded-xl px-3 py-2 hover:bg-surface"
                    onClick={()=>addToCart(p)}>
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-mute">KSh {p.salePrice} — #{p.barcode}</div>
            </button>
          ))}
          {!filtered.length && <div className="text-sm text-mute">No products</div>}
        </div>
      </Section>

      <Section title="Cart">
        <div className="space-y-2">
          {cart.map((it,idx)=>(
            <div key={idx} className="flex items-center justify-between border border-line rounded-xl px-3 py-2">
              <div>
                <div className="font-medium">{it.name}</div>
                <div className="text-xs text-mute">#{it.barcode}</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn" onClick={()=>dec(it)}>-</button>
                <input className="w-14 text-center border rounded-xl" value={it.qty} onChange={e=>{
                  const v = Math.max(1, Number(e.target.value||1))
                  setCart(list=>list.map(x=>x===it? {...x, qty:v}:x))
                }} />
                <button className="btn" onClick={()=>inc(it)}>+</button>
              </div>
              <div className="w-24 text-right">{fmt(Number(it.salePrice||0)*Number(it.qty||0))}</div>
              <button className="btn" onClick={()=>remove(it)}>Remove</button>
            </div>
          ))}
          {!cart.length && <div className="text-sm text-mute">Cart is empty</div>}
        </div>
      </Section>

      <Section title="Summary">
        <div className="space-y-2">
          <div className="flex justify-between"><span>Total</span><strong>{fmt(total)}</strong></div>
          <div className="flex gap-2">
            {['Cash','M-PESA','Bank','Other'].map(m=>(
              <button key={m} className={`btn ${payment===m? 'btn-primary':''}`} onClick={()=>setPayment(m)}>{m}</button>
            ))}
          </div>
          <div className="mt-4">
            <div className="text-sm text-mute mb-1">Client:</div>
            <div className="space-y-2 max-h-52 overflow-auto">
              {clients.map(c => (
                <button key={c.phone} className={`block w-full text-left border border-line rounded-xl px-3 py-2 ${client?.phone===c.phone? 'bg-surface':''}`}
                        onClick={()=>setClient(c)}>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-mute">+{c.phone}</div>
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary w-full mt-4" onClick={confirmPurchase}>Confirm Purchase</button>
        </div>
      </Section>
    </div>
  )
}