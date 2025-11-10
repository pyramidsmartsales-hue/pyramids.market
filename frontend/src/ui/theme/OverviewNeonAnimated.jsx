import React, { useEffect } from "react";
import { motion } from "framer-motion";

export default function OverviewNeonAnimated({ children }) {
  // إنشاء حركة التدرج
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes gradientMove {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <div className="min-h-screen overflow-hidden relative">
      {/* الخلفية المتحركة */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(-45deg, #0F172A, #1E293B, #0EA5E9, #A855F7, #F59E0B)",
          backgroundSize: "400% 400%",
          animation: "gradientMove 5s ease infinite", // 🔥 الحركة الآن أسرع (كل 5 ثوانٍ)
          filter: "blur(60px)",
        }}
      />

      {/* المحتوى الداخلي */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </div>
  );
}
