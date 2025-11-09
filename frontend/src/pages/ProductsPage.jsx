import { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { exportToCSV, exportToExcelFromTable, exportTableToPDF } from "../lib/exporters";

function getVal(obj, keys, def = "") {
  for (const k of keys) if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  return def;
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const tableRef = useRef(null);

  const apiBase = import.meta.env.VITE_API_URL || "https://pyramids-market.onrender.com/api";

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiBase}/products`);
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : (data.products || []));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [apiBase]);

  const rowsForExport = products.map((p) => ({
    Name: getVal(p, ["name"]),
    "Sale Price": getVal(p, ["salePrice", "price"], 0),
    Cost: getVal(p, ["costPrice", "cost"], 0),
    Qty: getVal(p, ["quantity", "qty"], 0),
    Status: getVal(p, ["active"], true) ? "Active" : "Inactive",
    "Profit/Unit": (getVal(p, ["salePrice", "price"], 0) - getVal(p, ["costPrice", "cost"], 0)),
    "Total Sales": getVal(p, ["totalSales"], 0),
    "Last Update": p.updatedAt ? new Date(p.updatedAt).toISOString().slice(0, 10) : "",
  }));

  const exportCsv = () => exportToCSV(rowsForExport, "products.csv");
  const exportExcel = () => exportToExcelFromTable(tableRef.current, "products.xls");
  const exportPDF = () => exportTableToPDF(tableRef.current, "Products");

  const handleImportCsvText = async () => {
    if (!csvText.trim()) return alert("Paste CSV content first.");
    setImporting(true);
    try {
      const res = await fetch(`${apiBase}/products/bulk-import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvText }),
      });
      const data = await res.json();
      if (data?.ok) {
        alert(`Imported: ${data.upserted} items`);
        const r = await fetch(`${apiBase}/products`);
        const refreshed = await r.json();
        setProducts(Array.isArray(refreshed) ? refreshed : (refreshed.products || []));
        setCsvText("");
      } else {
        alert(data?.error || "Import failed");
      }
    } catch (e) { console.error(e); alert("Import failed"); }
    finally { setImporting(false); }
  };

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Products</h2>
            <div className="flex gap-2">
              <Button onClick={exportCsv}>Export CSV</Button>
              <Button variant="outline" onClick={exportExcel}>Export Excel</Button>
              <Button variant="outline" onClick={exportPDF}>Export PDF</Button>
            </div>
          </div>

          {loading ? (
            <div>Loading…</div>
          ) : (
            <div className="overflow-x-auto">
              <table ref={tableRef} className="min-w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border">Name</th>
                    <th className="p-2 border">Sale Price</th>
                    <th className="p-2 border">Cost</th>
                    <th className="p-2 border">Qty</th>
                    <th className="p-2 border">Status</th>
                    <th className="p-2 border">Profit/Unit</th>
                    <th className="p-2 border">Total Sales</th>
                    <th className="p-2 border">Last Update</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p._id || p.id}>
                      <td className="p-2 border">{getVal(p, ["name"])}</td>
                      <td className="p-2 border">{getVal(p, ["salePrice", "price"], 0)}</td>
                      <td className="p-2 border">{getVal(p, ["costPrice", "cost"], 0)}</td>
                      <td className="p-2 border">{getVal(p, ["quantity", "qty"], 0)}</td>
                      <td className="p-2 border">{getVal(p, ["active"], true) ? "Active" : "Inactive"}</td>
                      <td className="p-2 border">
                        {getVal(p, ["salePrice", "price"], 0) - getVal(p, ["costPrice", "cost"], 0)}
                      </td>
                      <td className="p-2 border">{getVal(p, ["totalSales"], 0)}</td>
                      <td className="p-2 border">
                        {p.updatedAt ? new Date(p.updatedAt).toISOString().slice(0, 10) : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h3 className="font-semibold mb-2">Import CSV (paste)</h3>
          <p className="text-sm text-gray-600 mb-2">
            الصق محتوى CSV هنا (أول صف عناوين الأعمدة). أعمدة مقترحة:
            <code> name,salePrice,costPrice,quantity,active,totalSales,updatedAt </code>
          </p>
          <textarea
            className="w-full border rounded p-2 h-40"
            placeholder="name,salePrice,costPrice,quantity,active
Green Tea,675,420,120,true"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
          />
          <div className="mt-2">
            <Button onClick={handleImportCsvText} disabled={importing}>
              {importing ? "Importing..." : "Import"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
