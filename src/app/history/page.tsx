"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import Masthead from "@/components/sections/masthead";
import SidebarGuide from "@/components/sections/sidebar-guide";
import { Loader2, Library, Clock, AlertCircle, Play, Calendar, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";
import { getFormattedGregorianDate, getFormattedHijriDate, getDaysUntilRamadan } from "@/lib/date-utils";

interface HistoryItem {
  id: string;
  videoId: string;
  videoTitle: string;
  videoThumbnail: string;
  watchedAt: string;
}

export default function HistoryPage() {
  const { userId } = useUser();
  const { language, showGregorianDate, showHijriDate, hijriOffset, showRamadanCountdown } = useI18n();
  const [daysUntilRamadan, setDaysUntilRamadan] = useState<number | null>(null);

  useEffect(() => {
    setDaysUntilRamadan(getDaysUntilRamadan());
  }, []);

  const isRamadanCountdownVisible = showRamadanCountdown && daysUntilRamadan !== null && daysUntilRamadan > 0;
  const mainPaddingTop = isRamadanCountdownVisible ? 'pt-[104px] sm:pt-[100px]' : 'pt-[64px]';

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const parts = [];

    if (showGregorianDate) {
      parts.push(getFormattedGregorianDate(language, date) + ' م');
    }

    if (showHijriDate) {
      parts.push(getFormattedHijriDate(language, hijriOffset, date));
    }

    if (parts.length === 0) return '';
    return parts.join(' | ');
  };
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchHistory = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/history?userId=${userId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "فشل جلب سجل المشاهدة");
      }
      
      if (Array.isArray(data)) {
        setHistory(data);
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchHistory();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#0f0f0f]" dir="rtl">
      <Masthead onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <SidebarGuide isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className={`mr-0 lg:mr-[240px] ${mainPaddingTop} pb-24 px-4 md:px-8 transition-all duration-300`}>
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-8 md:py-12"
          >
            <div className="flex items-center justify-between gap-6 mb-12">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 shadow-sm border border-red-100">
                  <Library className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">سجل المشاهدة</h1>
                  <p className="text-[#606060] text-sm mt-1">تابع الفيديوهات التي شاهدتها مؤخراً</p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-40 space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-red-100 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-[#606060] text-sm font-medium animate-pulse tracking-wide">جاري تحميل سجل المشاهدة...</p>
              </div>
            ) : error ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2rem] p-16 text-center border border-red-100 shadow-sm max-w-lg mx-auto"
              >
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-xl font-bold mb-3 text-red-900">حدث خطأ ما</h2>
                <p className="text-red-600/70 mb-8 leading-relaxed">
                  {error}
                </p>
                <button 
                  onClick={fetchHistory}
                  className="px-8 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95"
                >
                  إعادة المحاولة
                </button>
              </motion.div>
            ) : history.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2.5rem] p-16 text-center border border-gray-100 shadow-sm max-w-xl mx-auto"
              >
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Clock className="w-12 h-12 text-gray-200" />
                </div>
                <h2 className="text-2xl font-bold mb-4">سجل المشاهدة فارغ</h2>
                <p className="text-[#606060] mb-10 leading-relaxed text-lg">
                  لم تشاهد أي فيديوهات بعد. ابدأ باستكشاف المحتوى وسوف يظهر تاريخ مشاهداتك هنا.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-3 px-10 py-4 bg-red-600 text-white rounded-[1.25rem] font-bold hover:bg-red-700 active:scale-95 transition-all shadow-xl shadow-red-600/20 group"
                >
                  تصفح الفيديوهات
                  <ArrowRight size={20} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 gap-6"
              >
                {history.map((item) => (
                  <motion.div 
                    key={item.id}
                    variants={itemVariants}
                    className="group/item relative"
                  >
                    <Link 
                      href={`/watch/${item.videoId}`} 
                      className="flex flex-col md:flex-row gap-6 p-5 bg-white border border-gray-100 rounded-[2rem] hover:border-red-100 hover:shadow-2xl hover:shadow-red-500/5 transition-all duration-500"
                    >
                      <div className="relative w-full md:w-[320px] aspect-video rounded-2xl overflow-hidden flex-shrink-0 bg-gray-50">
                        <img 
                          src={item.videoThumbnail} 
                          alt={item.videoTitle} 
                          className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/item:opacity-100">
                          <div className="w-14 h-14 bg-red-600 text-white rounded-full flex items-center justify-center shadow-2xl scale-90 group-hover/item:scale-100 transition-transform duration-500 shadow-red-600/40">
                            <Play size={28} className="fill-current mr-[-2px]" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1 py-2 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-[#0f0f0f] line-clamp-2 mb-3 leading-snug group-hover/item:text-red-600 transition-colors">
                            {item.videoTitle}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-[#606060]">
                              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 font-bold text-[11px] text-gray-500 uppercase tracking-wide">
                                <Calendar size={12} />
                                {formatDate(item.watchedAt)}
                              </div>

                            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 font-bold text-[11px] text-gray-500 uppercase tracking-wide">
                              <Clock size={12} />
                              {new Date(item.watchedAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-6 flex items-center justify-between">
                          <span className="text-xs font-bold text-red-600 bg-red-50 px-4 py-1.5 rounded-full border border-red-100">
                            تمت المشاهدة
                          </span>
                          <div className="p-2.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover/item:opacity-100">
                            <Trash2 size={20} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {history.length > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-20 text-center"
              >
                <div className="inline-flex items-center gap-4 px-8 py-3 bg-gray-50 rounded-full text-[11px] font-bold text-gray-400 uppercase tracking-widest border border-gray-100">
                  <span>إجمالي المشاهدات: {history.length} فيديو</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
