import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'

/* ✅ شعار قابل لتغيير الحجم */
function Logo({ size = 88 }) {
  return (
    <img
      src="/logo.png"
      alt="Pyramids Market"
      width={size}
      height={size}
      className="object-contain" // لا يوجد إطار دائري
      onError={(e) => {
        e.currentTarget.outerHTML =
          `<div style="width:${size}px;height:${size}px" class="grid place-items-center text-cocoa font-bold">PM</div>`
      }}
    />
  )
}

/* ⏰ ساعة تنسيق 12 ساعة */
function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const time = now.toLocaleTimeString('en-KE', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  })
  return <div className="badge">{time}</div>
}

/* 🧭 عناصر القائمة الجانبية */
const NAV = [
  { to: '/overview', label: 'Overview' },
  { to: '/whatsapp', label: 'WhatsApp' },
  { to: '/products', label: 'Products' },
  { to: '/expenses', label: 'Expenses' },
  { to: '/pos', label: 'POS' },
  { to: '/clients', label: 'Clients' },
]

export default function Layout({ children }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-base text-ink">
      {/* ✅ الشريط العلوي: شعار (44px) في المنتصف + ساعة على اليمين */}
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur border-b border-line">
        <div className="h-20 px-4 md:px-6 grid grid-cols-3 items-center">
          <div className="flex items-center gap-3">
            <button className="md:hidden btn" onClick={() => setOpen(v => !v)}>Menu</button>
          </div>

          <div className="flex flex-col items-center justify-center">
            <Logo size={44} /> {/* شعار علوي صغير */}
            <span className="mt-1 font-semibold">Pyramids Market</span>
          </div>

          <div className="flex justify-end">
            <Clock />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* ✅ الشريط الجانبي (يسار) */}
        <aside
          className={`fixed md:static inset-y-0 left-0 z-20 bg-white border-r border-line w-64 p-4 transition-transform md:translate-x-0 ${
            open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="flex flex-col items-center mb-6">
            <Logo size={88} /> {/* شعار جانبي كبير */}
            <div className="font-semibold mt-2">Pyramids Market</div>
          </div>

          <nav className="space-y-1">
            {NAV.map(i => (
              <NavLink
                key={i.to}
                to={i.to}
                className={({ isActive }) =>
                  `block rounded-xl px-3 py-2 border text-center ${
                    isActive ? 'bg-base border-line' : 'border-transparent hover:border-line hover:bg-base'
                  } transition`
                }
                onClick={() => setOpen(false)}
              >
                <span className="font-medium">{i.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* المحتوى */}
        <main className="flex-1 min-w-0 p-4 md:p-6">{children}</main>
      </div>

      {/* ✅ التذييل */}
      <footer className="text-center text-xs text-mute py-4 border-t border-line mt-10">
        © 2025 Pyramids Market — Developed and owned by Ahmed Ali
      </footer>
    </div>
  )
}
