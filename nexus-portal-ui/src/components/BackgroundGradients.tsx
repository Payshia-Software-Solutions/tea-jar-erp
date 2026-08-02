"use client";

import { motion } from "framer-motion";

export default function BackgroundGradients() {
  return (
    <div className="fixed inset-0 h-screen w-screen -z-20 overflow-hidden pointer-events-none">
      {/* Subtle top-left accent */}
      <div className="absolute top-0 left-0 w-[800px] h-[600px] opacity-40 dark:opacity-20">
        <div
          className="absolute inset-0 rounded-full blur-[160px]"
          style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.07) 0%, transparent 70%)' }}
        />
      </div>
      {/* Subtle bottom-right accent */}
      <div className="absolute bottom-0 right-0 w-[700px] h-[500px] opacity-30 dark:opacity-15">
        <div
          className="absolute inset-0 rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.06) 0%, transparent 70%)' }}
        />
      </div>
    </div>
  );
}
