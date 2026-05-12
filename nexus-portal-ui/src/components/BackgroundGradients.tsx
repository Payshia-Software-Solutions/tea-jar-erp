"use client";

import { motion } from "framer-motion";

export default function BackgroundGradients() {
  return (
    <div className="fixed inset-0 h-screen w-screen -z-20 overflow-hidden bg-background pointer-events-none transition-colors duration-500">
      {/* Primary Glow Spot */}
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/[0.03] dark:bg-indigo-600/10 rounded-full blur-[120px] transition-colors duration-500"
      />

      {/* Secondary Pulse Spot */}
      <motion.div
        animate={{
          x: [0, -100, 0],
          y: [0, 100, 0],
          scale: [1.2, 1, 1.2],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-indigo-500/[0.02] dark:bg-indigo-500/5 rounded-full blur-[140px] transition-colors duration-500"
      />

      {/* Accent Spot */}
      <motion.div
        animate={{
          opacity: [0.05, 0.15, 0.05],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-400/[0.03] rounded-full blur-[100px]"
      />
    </div>
  );
}
