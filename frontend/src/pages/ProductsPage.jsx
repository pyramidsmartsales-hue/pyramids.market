import React from 'react'

const PRODUCTS = [
  { id: 1, name: 'Green Tea', stock: 120, price: 6.75 },
  { id: 2, name: 'Chocolate Bar', stock: 88, price: 2.5 },
  { id: 3, name: 'Coffee Beans', stock: 45, price: 12.99 },
]

function ProductCard({ name, stock, price }) {
  return (
    <div className="bg-[#FFF9E6] border border-line rounded-2xl p-5 hover:shadow-soft transition">
      <div className="text-base font-semibold text-ink">{name}</div>
      <div className="mt-2 text-sm text-mute">Stock: {stock} units</div>
      <div className="text-sm text-mute">Price: ${price}</div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-cocoa">Products</h1>
        <button className="btn btn-primary">Add New Product</button>
      </header>

      <div className="bg-elev p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PRODUCTS.map(p => (
            <ProductCard key={p.id} name={p.name} stock={p.stock} price={p.price} />
          ))}
        </div>
      </div>
    </div>
  )
}
