"use client";

import React from 'react';
import { motion } from 'framer-motion';

export default function Loading() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6" dir="rtl">
      <div className="relative flex items-center justify-center">
        {/* Outer pulse */}
        <motion.div
          className="absolute w-24 h-24 rounded-full border-2 border-red-500/20"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Main Spinner */}
        <motion.div
          className="w-12 h-12 rounded-full border-4 border-red-600 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        
        {/* Inner dot */}
        <motion.div
          className="absolute w-2 h-2 bg-red-600 rounded-full"
          animate={{
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
      
      <motion.div 
        className="flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 bg-red-600 rounded-full"
              animate={{
                y: [0, -6, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
        <p className="text-[#606060] font-medium text-sm">جاري التحميل...</p>
      </motion.div>
    </div>
  );
}
