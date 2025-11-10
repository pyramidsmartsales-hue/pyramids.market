import React, { useEffect } from "react";
import { motion } from "framer-motion";

/**
 * خلفية نيونيّة متناسقة مع ألوان شعار Pyramids Mart
 * — ذهبي + بني + أسود + لمسات ضوء دافئة
 * بدون ثلاثي الأبعاد، فقط حركة تدرّج وانسياب خفيف
 */
export default function OverviewNeonAnimated({ children }) {
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes gradientFlow {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes blobA {
        0% { transform: rotate(0deg) scale(1); }
        50% { transform: rotate(180deg) scale(1.05); }
        100% { transform: rotate(360deg) scale(1); }
      }
      @keyframes blobB {
        0% { transform: rotate(0deg) scale(1); }
        50% { transform: rotate(-180deg) scale(1.05); }
        100% { transform: rotate(-360deg) scale(1); }
      }
      @keyframes streakMove {
        0%   { transform: translateX(-10%) skewX(-12deg); opacity:.25; }
        50%  { opacity:.45; }
        100% { transform: translateX(110%) skewX(-12deg); opacity:.25; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: "#0B0F14" }}
    >
      {/* 🌄 خلفية متدرجة بألوان الشعار */}
      <div
        className="absolute inset-0 -z-30"
        style={{
          background:
            "linear-gradient(-45deg, #1A120B, #2B1D12, #F2C041, #8B5E3C, #1A120B)",
          backgroundSize: "400% 400%",
          animation: "gradientFlow 6s ease-in-out infinite",
          filter: "saturate(115%) contrast(105%)",
        }}
      />

      {/* ☀️ دوائر ضوئية متناغمة */}
      <div aria-hidden className="absolute inset-0 -z-20 pointer-events-none">
        <div
          style={{
            position: "absolute",
            top: "8%",
            left: "6%",
            width: "60vmax",
            height: "60vmax",
            borderRadius: "50%",
            background:
              "radial-gradient(40% 40% at 50% 50%, rgba(242,192,65,0.18), transparent 70%)",
            mixBlendMode: "screen",
            animation: "blobA 14s linear infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            right: "10%",
            width: "55vmax",
            height: "55vmax",
            borderRadius: "50%",
            background:
              "radial-gradient(40% 40% at 50% 50%, rgba(139,94,60,0.20), transparent 70%)",
            mixBlendMode: "screen",
            animation: "blobB 18s linear infinite",
          }}
        />
      </div>

      {/* ✨ خطوط ضوء دافئة */}
      <div aria-hidden className="absolute inset-0 -z-10 pointer-events-none">
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: i === 0 ? "25%" : "70%",
              left: "-10%",
              width: "45%",
              height: "2px",
              background:
                "linear-gradient(90deg, transparent, rgba(242,192,65,0.4), rgba(139,94,60,0.35), transparent)",
              filter: "blur(1px)",
              animation: `streakMove ${i === 0 ? 6 : 8}s ease-in-out ${
                i ? "1s" : "0s"
              } infinite`,
              mixBlendMode: "screen",
            }}
          />
        ))}
      </div>

      {/* 💎 المحتوى */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        {children}
      </motion.div>

      {/* 🧩 ضجيج بسيط للواقعية */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 opacity-[.05]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.8'/></svg>\")",
          backgroundSize: "auto",
          mixBlendMode: "overlay",
        }}
      />
    </div>
  );
}
