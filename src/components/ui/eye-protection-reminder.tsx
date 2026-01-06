"use client";

import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Info, Clock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const REMINDER_INTERVAL = 20 * 60 * 1000; // 20 minutes
const LONG_SESSION_THRESHOLD = 60 * 60 * 1000; // 1 hour

export function EyeProtectionReminder() {
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [showModal, setShowModal] = useState(false);
  const [lastReminderTime, setLastReminderTime] = useState<number>(Date.now());

  const showToastReminder = useCallback(() => {
    toast.info("تذكير لحماية عينيك 👓", {
      description: "طبق قاعدة 20-20-20: كل 20 دقيقة، انظر لشيء يبعد 20 قدماً لمدة 20 ثانية.",
      duration: 10000,
      action: {
        label: "حسناً",
        onClick: () => console.log("Eye reminder acknowledged"),
      },
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const sessionDuration = now - sessionStartTime;
      const timeSinceLastReminder = now - lastReminderTime;

      if (timeSinceLastReminder >= REMINDER_INTERVAL) {
        showToastReminder();
        setLastReminderTime(now);
      }

      // Show modal for long sessions or first time in a day
      const lastModalShown = localStorage.getItem("lastEyeModalShown");
      const today = new Date().toDateString();
      
      if (sessionDuration >= LONG_SESSION_THRESHOLD && lastModalShown !== today) {
        setShowModal(true);
        localStorage.setItem("lastEyeModalShown", today);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [sessionStartTime, lastReminderTime, showToastReminder]);

  return (
    <>
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-none shadow-2xl rounded-3xl p-6 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600" />
          
          <DialogHeader className="pt-4">
            <div className="flex justify-center mb-4">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full"
              >
                <Eye className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </motion.div>
            </div>
            <DialogTitle className="text-2xl font-bold text-center text-zinc-900 dark:text-white">
              صحة عينيك تهمنا! 👓
            </DialogTitle>
            <DialogDescription className="text-center text-zinc-600 dark:text-zinc-400 text-lg mt-2">
              لقد كنت تشاهد لفترة طويلة. هل سمعت عن قاعدة <span className="font-bold text-blue-600">20-20-20</span>؟
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 py-6">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-start gap-4"
            >
              <div className="bg-blue-500 text-white p-2 rounded-xl shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-white">كل 20 دقيقة</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">خذ استراحة قصيرة من الشاشة.</p>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-start gap-4"
            >
              <div className="bg-indigo-500 text-white p-2 rounded-xl shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-white">انظر لـ 20 قدماً</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">ركز بصرك على شيء بعيد لإراحة عضلات العين.</p>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-start gap-4"
            >
              <div className="bg-purple-500 text-white p-2 rounded-xl shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-white">لمدة 20 ثانية</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">هذا الوقت كافٍ لتقليل إجهاد العين بشكل ملحوظ.</p>
              </div>
            </motion.div>
          </div>

          <DialogFooter className="sm:justify-center">
            <DialogClose asChild>
              <Button 
                className="w-full sm:w-auto px-8 py-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
              >
                فهمت، سأهتم بعيني!
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
