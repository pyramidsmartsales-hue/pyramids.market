import React, { useEffect, useMemo, useState } from "react";
import Section from "../components/Section";
import {
  getWAStatus,
  getWAQr,
  initWA,
  resetWASession,
  sendBulk,
} from "../lib/whatsappWeb";

// Demo clients – later you can load real clients from your DB
const CLIENTS = [
  { id: 1, name: "Mohamed Adel", phone: "+254700000001" },
  { id: 2, name: "Sara Nabil", phone: "+254700000002" },
  { id: 3, name: "Omar Ali", phone: "+254700000003" },
];

function StatusDot({ ok }) {
  return (
    <span
      className={`inline-block w-3 h-3 rounded-full ${
        ok ? "bg-green-500" : "bg-red-500"
      }`}
    />
  );
}

export default function WhatsAppPage() {
  const [status, setStatus] = useState({ connected: false, hasQR: false });
  const [qrDataUrl, setQr] = useState(null);
  const [selectedIds, setSelected] = useState([]);
  const [message, setMessage] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [report, setReport] = useState([]);
  const [booting, setBooting] = useState(false);

  const allIds = useMemo(() => CLIENTS.map((c) => c.id), []);
  const allSelected = selectedIds.length === allIds.length;
  const noneSelected = selectedIds.length === 0;

  // Poll status + QR
  useEffect(() => {
    let timer = null;
    async function tick() {
      try {
        const st = await getWAStatus();
        setStatus(st);
        if (!st.connected && st.hasQR) {
          const { dataUrl } = await getWAQr();
          setQr(dataUrl || null);
        } else {
          setQr(null);
        }
      } catch {
        // ignore network hiccups
      }
      timer = setTimeout(tick, 3000);
    }
    tick();
    return () => timer && clearTimeout(timer);
  }, []);

  function toggleAll() {
    setSelected(allSelected ? [] : allIds);
  }
  function toggleOne(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleInit() {
    setBooting(true);
    try {
      await resetWASession(); // force fresh QR
    } catch {}
    await initWA();
    setBooting(false);
  }

  async function doSend() {
    if (noneSelected) {
      alert("Select at least one client.");
      return;
    }
    if (!message && !mediaUrl) {
      alert("Write a message or add media URL.");
      return;
    }
    if (!status.connected) {
      alert("WhatsApp is not connected yet. Scan the QR first.");
      return;
    }

    setSending(true);
    setReport([]);
    const targets = CLIENTS.filter((c) => selectedIds.includes(c.id)).map((c) => c.phone);

    const res = await sendBulk(targets, message, mediaUrl || undefined);
    if (!res.ok) {
      alert("Send failed: " + (res.error?.message || res.error || "unknown"));
      setSending(false);
      return;
    }
    setReport(res.results || []);
    setSending(false);
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Clients */}
      <Section
        title="Clients"
        actions={
          <div className="flex items-center gap-3">
            <button className="btn" onClick={toggleAll}>
              {allSelected ? "Unselect All" : "Select All"}
            </button>
            <div className="flex items-center gap-2">
              <StatusDot ok={status.connected} />
              <span className="text-sm text-mute">
                {status.connected ? "Connected" : "Not connected"}
              </span>
            </div>
          </div>
        }
      >
        <ul className="space-y-2">
          {CLIENTS.map((c) => (
            <li key={c.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedIds.includes(c.id)}
                onChange={() => toggleOne(c.id)}
              />
              <button
                className={`flex-1 text-left rounded-xl px-3 py-2 border ${
                  selectedIds.includes(c.id)
                    ? "bg-base border-line"
                    : "border-line hover:bg-base"
                }`}
                onClick={() => toggleOne(c.id)}
              >
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-mute">{c.phone}</div>
              </button>
            </li>
          ))}
        </ul>
      </Section>

      {/* Composer */}
      <Section title="Compose message">
        <div className="space-y-3">
          <div className="text-sm text-mute">
            To:{" "}
            <b>
              {noneSelected
                ? "No clients selected"
                : `${selectedIds.length} clients selected`}
            </b>
          </div>

          <textarea
            className="w-full rounded-xl border border-line p-3"
            rows={6}
            placeholder="Write your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <input
            className="w-full rounded-xl border border-line p-3"
            placeholder="Optional image URL (public link)"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
          />

          <div className="flex gap-2">
            <button
              className={`btn btn-primary ${
                sending ? "opacity-50 pointer-events-none" : ""
              }`}
              onClick={doSend}
            >
              {sending ? "Sending..." : "Send"}
            </button>
            <button
              className="btn"
              onClick={() => {
                setMessage("");
                setMediaUrl("");
              }}
            >
              Clear
            </button>
          </div>

          {report.length > 0 && (
            <div className="text-sm mt-2">
              <div className="font-semibold mb-1">Delivery report</div>
              <ul className="list-disc pl-5">
                {report.map((r, i) => (
                  <li key={i} className={r.ok ? "text-green-700" : "text-red-700"}>
                    {r.to}: {r.ok ? "OK" : "FAILED"}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Section>

      {/* QR / Controls */}
      <Section
        title="WhatsApp Web"
        actions={
          <div className="flex gap-2">
            <button
              className={`btn ${booting ? "opacity-50 pointer-events-none" : ""}`}
              onClick={handleInit}
            >
              {booting ? "Preparing..." : "Init / Refresh QR"}
            </button>
          </div>
        }
      >
        <div className="grid place-items-center h-64">
          {status.connected ? (
            <div className="text-green-700">Connected — you can send messages now.</div>
          ) : qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Scan QR"
              className="w-56 h-56 rounded-xl border border-line"
            />
          ) : (
            <div className="text-mute">
              Click “Init / Refresh QR”, then scan the code with WhatsApp → Linked devices.
            </div>
          )}
        </div>
        <p className="text-sm text-mute">
          This connects to your server at pyramids-market.onrender.com via Baileys
          (WhatsApp Web protocol).
        </p>
      </Section>
    </div>
  );
}
