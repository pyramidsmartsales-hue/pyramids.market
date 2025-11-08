import React from 'react'
import Card from '../components/Card'

const Stat = ({ title, value, delta }) => (
  <Card
    title={title}
    value={value}
    footer={<span className={delta.startsWith('+') ? 'text-green-600' : 'text-red-600'}>{delta} هذا الأسبوع</span>}
    icon={<div className="p-3 rounded-xl bg-base border border-line text-cocoa">★</div>}
  />
)

export default function OverviewPage(){
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">نظرة عامة</h1>
        <button className="btn btn-primary">إنشاء تقرير</button>
      </div>

      <section className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        <Stat title="إجمالي المبيعات" value="EGP 124,560" delta="+12%" />
        <Stat title="طلبات اليوم" value="86" delta="+6%" />
        <Stat title="العملاء الجدد" value="42" delta="+3%" />
        <Stat title="صافي الربح" value="EGP 31,220" delta="-2%" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-elev p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">الأداء الشهري</h2>
            <span className="badge">آخر 30 يوم</span>
          </div>
          <div className="h-48 grid place-items-center text-mute">[Chart Placeholder]</div>
        </div>
        <div className="bg-elev p-4">
          <h2 className="font-semibold mb-4">أفضل المنتجات</h2>
          <ul className="space-y-3">
            {[
              { name: 'عبوة قهوة عربية', sales: 842 },
              { name: 'تمور مميزة', sales: 695 },
              { name: 'شاي فاخر', sales: 512 },
            ].map((p) => (
              <li key={p.name} className="flex items-center justify-between">
                <span className="truncate mr-2">{p.name}</span>
                <span className="badge">{p.sales}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
