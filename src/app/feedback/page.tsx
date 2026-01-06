"use client";

import { useState, useEffect } from "react";
import Masthead from "@/components/sections/masthead";
import SidebarGuide from "@/components/sections/sidebar-guide";
import { MessageSquarePlus, Send, Image as ImageIcon, CheckCircle2, Headphones, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import { getDaysUntilRamadan } from "@/lib/date-utils";

export default function FeedbackPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { t, showRamadanCountdown } = useI18n();
  const [daysUntilRamadan, setDaysUntilRamadan] = useState<number | null>(null);

  useEffect(() => {
    setDaysUntilRamadan(getDaysUntilRamadan());
  }, []);

  const isRamadanCountdownVisible = showRamadanCountdown && daysUntilRamadan !== null && daysUntilRamadan > 0;
  const mainPaddingTop = isRamadanCountdownVisible ? 'pt-[104px] sm:pt-[100px]' : 'pt-[64px]';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSubmitted(true);
      toast.success("شكراً لمشاركتنا ملاحظاتك", {
        icon: <CheckCircle2 className="w-5 h-5 text-green-500" />
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <Masthead 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
      />
      <SidebarGuide isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className={`mr-0 lg:mr-[240px] ${mainPaddingTop} flex flex-col min-h-screen transition-all duration-300`}>
        <div className="bg-red-600 p-4 text-white">
          <div className="max-w-4xl mx-auto flex gap-2 bg-black/10 p-1 rounded-xl">
            <Link 
              href="/help"
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              {t('help')}
            </Link>
            <div className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold bg-white text-red-600">
              <MessageSquarePlus className="w-4 h-4" />
              {t('feedback')}
            </div>
            <Link 
              href="/support"
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
            >
              <Headphones className="w-4 h-4" />
              {t('support')}
            </Link>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.div 
                  key="form"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="bg-card rounded-3xl border border-border shadow-2xl overflow-hidden"
                >
                  <div className="bg-red-600 p-6 text-white flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                      <MessageSquarePlus className="w-8 h-8" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold">إرسال ملاحظات</h1>
                      <p className="opacity-80 text-sm text-white">ساعدنا في تحسين تجربة يوتيوب</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="p-8">
                    <div className="mb-6">
                      <label className="block text-sm font-bold text-muted-foreground mb-2">ما الذي يدور في ذهنك؟</label>
                      <textarea 
                        required
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="اكتب ملاحظاتك هنا بالتفصيل..."
                        className="w-full h-40 p-4 bg-muted rounded-2xl border-2 border-transparent focus:border-red-500 focus:bg-background outline-none transition-all resize-none text-lg text-foreground"
                      />
                    </div>

                    <div className="flex items-center gap-4 mb-8">
                      <button type="button" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors bg-muted px-4 py-2 rounded-xl text-sm font-semibold">
                        <ImageIcon className="w-5 h-5" />
                        إرفاق لقطة شاشة
                      </button>
                      <div className="flex-1 text-xs text-muted-foreground">سيتم إرسال معلومات النظام والمتصفح تلقائياً لمساعدتنا في تشخيص المشكلة.</div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isSending || !feedback.trim()}
                      className={`
                        w-full py-4 rounded-2xl font-bold text-white shadow-xl transition-all flex items-center justify-center gap-3
                        ${isSending ? 'bg-muted cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 active:scale-95'}
                      `}
                    >
                      {isSending ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-5 h-5 rotate-180" />
                          إرسال الآن
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center bg-card p-12 rounded-3xl border border-border shadow-2xl"
                >
                  <div className="inline-flex p-6 bg-green-500/10 rounded-full mb-6">
                    <CheckCircle2 className="w-16 h-16 text-green-500" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4 text-foreground">شكراً لك!</h2>
                  <p className="text-muted-foreground mb-8 max-w-sm mx-auto">لقد تم استلام ملاحظاتك بنجاح. تساعدنا مساهمتك في جعل يوتيوب أفضل للجميع.</p>
                  <button 
                    onClick={() => {
                      setSubmitted(false);
                      setFeedback("");
                    }}
                    className="bg-muted text-foreground px-8 py-3 rounded-xl font-bold hover:bg-muted/80 transition-colors"
                  >
                    إرسال ملاحظة أخرى
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
