import React from 'react'

/** Demo data — بدّلها لاحقًا ببياناتك من الـ API */
const PRODUCTS = [
  { id: 1, name: 'Green Tea', stock: 120, price: 675 },   // الأسعار بالشيلنغ الكيني
  { id: 2, name: 'Chocolate Bar', stock: 88, price: 250 },
  { id: 3, name: 'Coffee Beans', stock: 45, price: 1299 },
]

/** تنسيق الشيلنغ الكيني */
function fmtKSh(n) {
  return `KSh ${Number(n).toLocaleString('en-KE')}`
}

/** بطاقة منتج بأسلوب Mosaic (Light) */
function ProductCard({ name, stock, price }) {
  return (
    <div className="rounded-2xl border border-line bg-[#FFF9E6] p-5 hover:shadow-soft transition">
      <div className="text-base font-semibold text-ink">{name}</div>
      <div className="mt-2 text-sm text-mute">Stock: {stock} units</div>
      <div className="text-sm text-mute">Price: {fmtKSh(price)}</div>
    </div>
  )
}

export default function Products() {
  return (
    <div className="space-y-6">
      {/* العنوان + زر إضافة */}
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Products</h1>
        <button className="btn btn-primary">Add New Product</button>
      </header>

      {/* حاوية بيضاء مرتفعة */}
      <section className="bg-elev p-6">
        {/* شبكة بطاقات */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PRODUCTS.map((p) => (
            <ProductCard key={p.id} name={p.name} stock={p.stock} price={p.price} />
          ))}
        </div>
      </section>
    </div>
  )
}
