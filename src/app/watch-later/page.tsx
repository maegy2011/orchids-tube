"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Clock, Play, Trash2, Search, ArrowRight, X, Calendar, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWatchLater } from '@/hooks/useWatchLater';
import Masthead from '@/components/sections/masthead';
import SidebarGuide from '@/components/sections/sidebar-guide';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n-context';
import { getDaysUntilRamadan } from '@/lib/date-utils';

function formatDate(dateString: string, locale: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function WatchLaterPage() {
  const { getAllWatchLater, removeFromWatchLater, isLoaded } = useWatchLater();
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t, language, showRamadanCountdown } = useI18n();
  const [daysUntilRamadan, setDaysUntilRamadan] = useState<number | null>(null);

  useEffect(() => {
    setDaysUntilRamadan(getDaysUntilRamadan());
  }, []);

  const isRamadanCountdownVisible = showRamadanCountdown && daysUntilRamadan !== null && daysUntilRamadan > 0;
  const mainPaddingTop = isRamadanCountdownVisible ? 'pt-[104px] sm:pt-[100px]' : 'pt-[64px]';

  const allWatchLater = isLoaded ? getAllWatchLater() : [];
  
  const filteredWatchLater = allWatchLater.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.channelName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Masthead onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <SidebarGuide isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className={cn(
        mainPaddingTop, "pb-24 px-4 md:px-8 transition-all duration-300",
        language === 'ar' ? "mr-0 lg:mr-[240px]" : "ml-0 lg:ml-[240px]"
      )}>
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-8 md:py-12"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100 dark:border-blue-800">
                  <Clock className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">{t('watchLater')}</h1>
                  <p className="text-muted-foreground text-sm mt-1">فيديوهات خططت لمشاهدتها لاحقاً</p>
                </div>
              </div>

              <div className="relative group w-full md:w-96">
                <Search className={cn(
                  "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-600 transition-colors",
                  language === 'ar' ? "right-4" : "left-4"
                )} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search') + "..."}
                  className={cn(
                    "w-full py-3.5 bg-card border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm",
                    language === 'ar' ? "pr-11 pl-10" : "pl-11 pr-10"
                  )}
                />
                <AnimatePresence>
                  {searchQuery && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => setSearchQuery('')}
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors",
                        language === 'ar' ? "left-3" : "right-3"
                      )}
                    >
                      <X size={14} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {!isLoaded ? (
              <div className="flex flex-col items-center justify-center py-40 space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-blue-100 dark:border-blue-900/30 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-muted-foreground text-sm font-medium animate-pulse tracking-wide">جاري التحميل...</p>
              </div>
            ) : allWatchLater.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-[2.5rem] p-16 text-center border border-border shadow-sm max-w-xl mx-auto"
              >
                <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Clock className="w-12 h-12 text-blue-200 dark:text-blue-800" />
                </div>
                <h2 className="text-2xl font-bold mb-4">قائمتك فارغة</h2>
                <p className="text-muted-foreground mb-10 leading-relaxed text-lg">
                  لم تقم بإضافة أي فيديوهات لمشاهدتها لاحقاً.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-3 px-10 py-4 bg-blue-600 text-white rounded-[1.25rem] font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-600/20 group"
                >
                  اكتشف الفيديوهات
                  <ArrowRight size={20} className={cn("transition-transform", language === 'ar' ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1")} />
                </Link>
              </motion.div>
            ) : filteredWatchLater.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-card rounded-[2.5rem] p-20 text-center border border-border shadow-sm"
              >
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-muted-foreground opacity-20" />
                </div>
                <h2 className="text-2xl font-bold mb-3">لا توجد نتائج</h2>
                <p className="text-muted-foreground text-lg">
                  لم يتم العثور على فيديوهات تطابق "{searchQuery}"
                </p>
              </motion.div>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10"
              >
                <AnimatePresence mode="popLayout">
                  {filteredWatchLater.map((item) => (
                    <motion.div 
                      key={item.id}
                      variants={itemVariants}
                      layout
                      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                      className="group/card bg-card rounded-3xl overflow-hidden border border-border hover:border-blue-100 dark:hover:border-blue-900 transition-all duration-500"
                    >
                      <Link href={`/watch/${item.videoId}`} className="block relative aspect-video overflow-hidden">
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                          <div className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl scale-90 group-hover/card:scale-100 transition-transform duration-500 shadow-blue-600/40">
                            <Play size={28} className={cn("fill-current", language === 'ar' ? "mr-[-2px]" : "ml-1")} />
                          </div>
                        </div>
                        <div className={cn(
                          "absolute bottom-3 px-2 py-1 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold rounded-lg flex items-center gap-1.5",
                          language === 'ar' ? "left-3" : "right-3"
                        )}>
                          <Clock size={10} />
                          {item.duration}
                        </div>
                      </Link>
                      
                      <div className="p-5">
                        <Link href={`/watch/${item.videoId}`}>
                          <h3 className="font-bold text-foreground text-[15px] leading-snug line-clamp-2 mb-2 group-hover/card:text-blue-600 transition-colors h-10">
                            {item.title}
                          </h3>
                        </Link>
                        
                        <div className="flex items-center gap-2 mb-5">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                            <Video size={12} />
                          </div>
                          <p className="text-xs font-bold text-muted-foreground truncate">{item.channelName}</p>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              {formatDate(item.addedAt, language)}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => removeFromWatchLater(item.videoId)}
                            className="p-2.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-90"
                            title="إزالة"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {allWatchLater.length > 0 && filteredWatchLater.length > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-20 text-center"
              >
                <div className="inline-flex items-center gap-4 px-6 py-2.5 bg-muted rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-widest border border-border">
                  <span>إجمالي القائمة: {allWatchLater.length}</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
