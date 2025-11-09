// frontend/src/lib/excel.js
// Thin helpers around SheetJS (xlsx) to read .xlsx/.xls files in the browser.
import * as XLSX from "xlsx";

/**
 * Reads the first worksheet of an Excel file and returns an array of plain objects.
 * Header row is assumed to be on the first row. Empty cells become "".
 * @param {File|Blob|ArrayBuffer} fileOrBuffer
 * @returns {Promise<Array<Object>>}
 */
export async function readExcelRows(fileOrBuffer) {
  let arrayBuffer;
  if (fileOrBuffer instanceof ArrayBuffer) {
    arrayBuffer = fileOrBuffer;
  } else if (fileOrBuffer && typeof fileOrBuffer.arrayBuffer === "function") {
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else {
    throw new Error("Unsupported input to readExcelRows");
  }

  const wb = XLSX.read(arrayBuffer, { type: "array" });
  if (!wb.SheetNames || wb.SheetNames.length === 0) return [];
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
  return Array.isArray(json) ? json : [];
}

/**
 * Normalizes object keys to camelCase (letters and digits only) for fuzzy matching.
 * e.g., "Sale Price", "sale_price", "SALEPRICE" -> "saleprice" (we'll compare against simplified keys).
 */
export function simplifyKey(k) {
  return String(k || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Maps arbitrary Excel row keys to a canonical schema using a list of aliases per field.
 * @param {Object} row Original row from Excel (keys are header texts)
 * @param {Record<string, string[]>} aliases Map of canonicalField -> array of header aliases
 * @returns {Object} normalized row with canonical field names
 */
export function mapRowByAliases(row, aliases) {
  const out = {};
  const simplified = {};
  for (const [k, v] of Object.entries(row)) simplified[simplifyKey(k)] = v;

  for (const [target, names] of Object.entries(aliases)) {
    let val = "";
    for (const name of names) {
      const key = simplifyKey(name);
      if (key in simplified) {
        val = simplified[key];
        break;
      }
    }
    out[target] = val;
  }
  return out;
}
