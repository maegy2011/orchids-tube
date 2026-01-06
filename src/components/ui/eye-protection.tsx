"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, X, Clock, Info } from "lucide-react";
import { toast } from "sonner";

interface EyeProtectionProps {
  showModalInitially?: boolean;
}

export function EyeProtection({ showModalInitially = false }: EyeProtectionProps) {
  const [showModal, setShowModal] = useState(showModalInitially);
  const [lastReminderTime, setLastReminderTime] = useState(Date.now());

  useEffect(() => {
    // Show toast reminder every 20 minutes
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastReminderTime >= 20 * 60 * 1000) {
        showEyeToast();
        setLastReminderTime(now);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [lastReminderTime]);

  const showEyeToast = () => {
    toast.custom((t) => (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-blue-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-sm border border-blue-400/30 backdrop-blur-md"
      >
        <div className="bg-white/20 p-2 rounded-xl">
          <Eye className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-sm">أرح عينيك! 👓</h3>
          <p className="text-xs text-blue-100 mt-1">
            طبق قاعدة 20-20-20: انظر لمسافة 20 قدماً لمدة 20 ثانية.
          </p>
        </div>
        <button 
          onClick={() => toast.dismiss(t)}
          className="hover:bg-white/10 p-1 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    ), { duration: 10000 });
  };

  return (
    <AnimatePresence>
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border border-blue-100 dark:border-blue-900/30"
          >
            <div className="bg-blue-600 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="relative z-10">
                <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/30">
                  <Eye className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-black mb-2 leading-tight">صحة عينيك تهمنا 👓</h2>
                <p className="text-blue-100 text-lg opacity-90">دليل الراحة البصرية أثناء المشاهدة</p>
              </div>
            </div>
            
            <div className="p-8">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-2xl h-fit">
                    <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1 dark:text-white">قاعدة 20-20-20</h4>
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                      كل 20 دقيقة، خذ استراحة لمدة 20 ثانية وانظر إلى شيء يبعد عنك 20 قدماً (حوالي 6 أمتار).
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-2xl h-fit">
                    <Info className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1 dark:text-white">نصيحة سريعة</h4>
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                      تأكد من رمش عينيك باستمرار وتعديل سطوع الشاشة ليكون مريحاً لعينيك.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="w-full mt-10 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-500/25"
              >
                حسناً، فهمت!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
