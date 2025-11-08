import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import Logo from './Logo'

const NAV = [
  { to: '/whatsapp', label: 'WhatsApp', icon: '💬' },
  { to: '/products', label: 'Products', icon: '📦' },
  { to: '/expenses', label: 'Expenses', icon: '🪙' },
  { to: '/pos', label: 'POS', icon: '🧾' },
  { to: '/clients', label: 'Clients', icon: '👥' },
  { to: '/overview', label: 'Overview', icon: '📊' },
]

export default function Layout({ children }){
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-base text-ink">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur border-b border-line">
        <div className="h-14 px-4 md:px-6 flex items-center justify-between">
          <button className="md:hidden btn" onClick={()=>setOpen(v=>!v)}>القائمة</button>
          <div className="flex items-center gap-3">
            <Logo size={28} />
            <span className="font-semibold">Pyramids Market</span>
          </div>
          <div className="badge">Gold Theme</div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed md:static inset-y-0 right-0 md:right-auto z-20 bg-white border-l md:border-r border-line w-64 p-4 transition-transform md:translate-x-0 ${open? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
          <div className="flex items-center gap-3 mb-4">
            <Logo />
            <div>
              <div className="font-semibold">Pyramids Market</div>
              <div className="text-xs text-mute">Dashboard</div>
            </div>
          </div>
          <nav className="space-y-1">
            {NAV.map(i=> (
              <NavLink key={i.to} to={i.to}
                className={({isActive})=>`flex items-center gap-3 rounded-xl px-3 py-2 border ${isActive? 'bg-base border-line' : 'border-transparent hover:border-line hover:bg-base'} transition`}
                onClick={()=>setOpen(false)}
              >
                <span className="text-cocoa">{i.icon}</span>
                <span className="font-medium">{i.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="mt-6 p-3 bg-elev text-sm text-mute">الوضع: <b className="text-ink">فاتح</b></div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
