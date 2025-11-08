import React, { useMemo, useState } from 'react'
import Section from '../components/Section'

const PRODUCTS = [
  { id: 1, name:'Green Tea', price: 675, barcode: '1111' },
  { id: 2, name:'Chocolate Bar', price: 250, barcode: '2222' },
  { id: 3, name:'Coffee Beans', price: 1299, barcode: '3333' },
]
const CLIENTS = [
  { id: 1, name: 'Mohamed Adel', phone: '+254700000001' },
  { id: 2, name: 'Sara Nabil', phone: '+254700000002' },
  { id: 3, name: 'Omar Ali', phone: '+254700000003' },
]
const K = n => `KSh ${Number(n).toLocaleString('en-KE')}`

export default function POSPage() {
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState([])
  const [discount, setDiscount] = useState(0)
  const [points, setPoints] = useState(0)
  const [pay, setPay] = useState('Cash')
  const [client, setClient] = useState(null)

  const list = useMemo(()=>{
    const q = query.toLowerCase()
    return PRODUCTS.filter(p => p.name.toLowerCase().includes(q) || p.barcode.includes(q))
  }, [query])

  const subtotal = cart.reduce((a,b)=>a+b.price*b.qty,0)
  const final = Math.max(subtotal - discount, 0)

  function addItem(p){
    setCart(prev=>{
      const idx = prev.findIndex(x=>x.id===p.id)
      if (idx>=0) { const cp=[...prev]; cp[idx].qty++; return cp }
      return [...prev, {...p, qty:1}]
    })
  }
  function changeQty(id, qty){
    setCart(prev => prev.map(x => x.id===id ? {...x, qty: Math.max(1, qty)} : x))
  }
  function remove(id){ setCart(prev => prev.filter(x=>x.id!==id)) }
  function printInvoice(){ window.print() }
  function shareWhatsApp(){
    const text = encodeURIComponent(`Invoice total: ${K(final)} — Client: ${client?client.phone:'N/A'} — Points: ${points}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className="grid xl:grid-cols-4 gap-6">
      {/* Product Search */}
      <Section title="Product Search">
        <input className="w-full rounded-xl border border-line px-3 py-2" placeholder="Search by name or barcode..." value={query} onChange={e=>setQuery(e.target.value)} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {list.map(p=>(
            <button key={p.id} className="rounded-xl border border-line px-3 py-2 text-left hover:bg-base" onClick={()=>addItem(p)}>
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-mute">{K(p.price)} — #{p.barcode}</div>
            </button>
          ))}
        </div>
      </Section>

      {/* Cart */}
      <Section title="Cart">
        {cart.length===0 ? <div className="text-mute">No items yet</div> : (
          <ul className="space-y-2">
            {cart.map(item=>(
              <li key={item.id} className="flex items-center justify-between border border-line rounded-xl p-2">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-mute">{K(item.price)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" className="w-20 border border-line rounded-xl px-2 py-1" value={item.qty} onChange={e=>changeQty(item.id, +e.target.value)} />
                  <button className="btn" onClick={()=>remove(item.id)}>Remove</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Invoice Summary + Discount + Loyalty Points + Payment + Share/Print */}
      <Section title="Invoice Summary">
        <div className="space-y-3">
          <div className="flex justify-between"><span>Subtotal</span><b>{K(subtotal)}</b></div>
          <div className="flex justify-between">
            <span>Discount</span>
            <input type="number" className="w-32 border border-line rounded-xl px-2 py-1 text-right" value={discount} onChange={e=>setDiscount(+e.target.value)} />
          </div>
          <div className="flex justify-between">
            <span>Loyalty Points</span>
            <input type="number" className="w-32 border border-line rounded-xl px-2 py-1 text-right" value={points} onChange={e=>setPoints(+e.target.value)} />
          </div>
          <div className="flex justify-between"><span>Total</span><b>{K(final)}</b></div>

          <div>
            <div className="card-title mb-1">Payment Method</div>
            <div className="flex gap-2">
              {['Cash','M-PESA','Card'].map(m=>(
                <label key={m} className={`btn ${pay===m?'btn-primary':''}`}>
                  <input type="radio" className="hidden" checked={pay===m} onChange={()=>setPay(m)} />{m}
                </label>
              ))}
            </div>
          </div>

          <div className="text-sm text-mute">
            Client: <b>{client ? `${client.name} (${client.phone})` : 'None selected'}</b>
          </div>

          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={printInvoice}>Print</button>
            <button className="btn" onClick={shareWhatsApp}>Share via WhatsApp</button>
          </div>
        </div>
      </Section>

      {/* Select Client (from Clients page) */}
      <Section title="Select Client">
        <ul className="space-y-2">
          {CLIENTS.map(c => (
            <li key={c.id}>
              <button
                className={`w-full text-left rounded-xl px-3 py-2 border ${client?.id===c.id ? 'bg-base border-line' : 'border-line hover:bg-base'}`}
                onClick={()=>setClient(c)}
              >
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-mute">{c.phone}</div>
              </button>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}
