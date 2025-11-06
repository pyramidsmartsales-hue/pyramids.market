import React from 'react'
export default function OverviewPage(){
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">نظرة عامة — Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow">إجمالي العملاء</div>
        <div className="p-4 bg-white rounded shadow">المبيعات</div>
        <div className="p-4 bg-white rounded shadow">المصروفات</div>
      </div>
    </div>
  )
}
