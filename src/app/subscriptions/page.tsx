"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import Masthead from "@/components/sections/masthead";
import SidebarGuide from "@/components/sections/sidebar-guide";
import { Loader2, PlaySquare, Trash2, AlertCircle, Users, ArrowRight, Video } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n-context";
import { getDaysUntilRamadan } from "@/lib/date-utils";

interface Subscription {
  id: string;
  channelId: string;
  channelTitle: string;
  channelThumbnail: string | null;
  createdAt: string;
}

export default function SubscriptionsPage() {
  const { userId } = useUser();
  const { showRamadanCountdown } = useI18n();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [daysUntilRamadan, setDaysUntilRamadan] = useState<number | null>(null);

  useEffect(() => {
    setDaysUntilRamadan(getDaysUntilRamadan());
  }, []);

  const isRamadanCountdownVisible = showRamadanCountdown && daysUntilRamadan !== null && daysUntilRamadan > 0;
  const mainPaddingTop = isRamadanCountdownVisible ? 'pt-[104px] sm:pt-[100px]' : 'pt-[64px]';

  const fetchSubscriptions = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/subscriptions?userId=${userId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "فشل جلب الاشتراكات");
      }
      
      if (Array.isArray(data)) {
        setSubscriptions(data);
      } else {
        setSubscriptions([]);
      }
    } catch (err) {
      console.error("Error fetching subscriptions:", err);
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchSubscriptions();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const unsubscribe = async (channelId: string) => {
    if (!userId) return;
    try {
      const response = await fetch("/api/subscriptions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, channelId }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "فشل إلغاء الاشتراك");
      }
      
      setSubscriptions((prev) => prev.filter((s) => s.channelId !== channelId));
    } catch (err) {
      console.error("Error unsubscribing:", err);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#0f0f0f]" dir="rtl">
      <Masthead onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <SidebarGuide isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className={`mr-0 lg:mr-[240px] ${mainPaddingTop} pb-24 px-4 md:px-8 lg:px-12 transition-all duration-300`}>
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-10 md:py-16"
          >
            <div className="flex items-center gap-5 mb-12">
              <div className="w-16 h-16 rounded-[2rem] bg-red-600 flex items-center justify-center text-white shadow-xl shadow-red-600/20">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">الاشتراكات</h1>
                <p className="text-[#606060] text-sm font-medium mt-1">القنوات التي تتابعها وتلهمك</p>
              </div>
            </div>
  
            {loading ? (
              <div className="flex flex-col items-center justify-center py-40 space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-red-100 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-[#606060] text-sm font-black animate-pulse uppercase tracking-widest">جاري التحميل...</p>
              </div>
            ) : error ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2.5rem] p-16 text-center border border-red-100 shadow-sm max-w-lg mx-auto"
              >
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-xl font-black mb-3 text-red-900">حدث خطأ ما</h2>
                <p className="text-red-600/70 mb-8 font-medium">
                  {error}
                </p>
                <button 
                  onClick={fetchSubscriptions}
                  className="px-8 py-3 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95"
                >
                  إعادة المحاولة
                </button>
              </motion.div>
            ) : subscriptions.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[3rem] p-20 text-center border border-gray-100 shadow-sm max-w-2xl mx-auto"
              >
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Users className="w-12 h-12 text-gray-200" />
                </div>
                <h2 className="text-3xl font-black mb-4">قائمة اشتراكاتك فارغة</h2>
                <p className="text-[#606060] mb-12 leading-relaxed text-lg font-medium">
                  اشترك في قنواتك المفضلة لتصلك أحدث فيديوهاتهم فور نزولها وتدعم صُنّاع المحتوى.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-4 px-12 py-4 bg-red-600 text-white rounded-[1.5rem] font-black hover:bg-red-700 active:scale-95 transition-all shadow-2xl shadow-red-600/30 group"
                >
                  استكشف القنوات المميزة
                  <ArrowRight size={24} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8"
              >
                {subscriptions.map((sub) => (
                  <motion.div 
                    key={sub.channelId}
                    variants={itemVariants}
                    className="group relative bg-white border border-gray-100 rounded-[2.5rem] p-6 hover:border-red-100 hover:shadow-2xl hover:shadow-red-500/5 transition-all duration-500"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-6">
                        <div className="absolute -inset-1.5 bg-gradient-to-br from-red-600 to-purple-600 rounded-full blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
                        <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-50 border-4 border-white shadow-md">
                          {sub.channelThumbnail ? (
                            <img src={sub.channelThumbnail} alt={sub.channelTitle} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-black text-3xl">
                              {sub.channelTitle.charAt(0)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-black text-[#0f0f0f] mb-2 line-clamp-1 group-hover:text-red-600 transition-colors">{sub.channelTitle}</h3>
                      <div className="flex items-center gap-2 text-gray-400 text-sm font-bold mb-8 uppercase tracking-widest">
                        <Video size={14} />
                        <span>قناة مفعلة</span>
                      </div>
                      
                      <div className="w-full flex items-center gap-3">
                        <Link 
                          href="/" 
                          className="flex-1 flex items-center justify-center h-12 bg-gray-50 text-[#0f0f0f] rounded-2xl font-bold hover:bg-gray-100 transition-all active:scale-95"
                        >
                          عرض القناة
                        </Link>
                        <button 
                          onClick={() => unsubscribe(sub.channelId)}
                          className="w-12 h-12 flex items-center justify-center bg-gray-50 text-gray-400 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all active:scale-95 group/del"
                          title="إلغاء الاشتراك"
                        >
                          <Trash2 size={20} className="group-hover/del:animate-bounce" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
  
            {subscriptions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-24 text-center"
              >
                <div className="inline-flex items-center gap-4 px-8 py-3 bg-gray-50 rounded-full text-[11px] font-black text-gray-400 uppercase tracking-widest border border-gray-100">
                  <span>إجمالي اشتراكاتك: {subscriptions.length} قناة</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
