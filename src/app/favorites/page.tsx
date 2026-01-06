"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, Play, Trash2, Search, ArrowRight, X, Calendar, Video, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFavorites } from '@/hooks/useFavorites';
import Masthead from '@/components/sections/masthead';
import SidebarGuide from '@/components/sections/sidebar-guide';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n-context';
import { getDaysUntilRamadan } from '@/lib/date-utils';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function FavoritesPage() {
  const { getAllFavorites, removeFavorite, isLoaded } = useFavorites();
  const { direction, showRamadanCountdown } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [daysUntilRamadan, setDaysUntilRamadan] = useState<number | null>(null);

  useEffect(() => {
    setDaysUntilRamadan(getDaysUntilRamadan());
  }, []);

  const isRamadanCountdownVisible = showRamadanCountdown && daysUntilRamadan !== null && daysUntilRamadan > 0;
  const mainPaddingTop = isRamadanCountdownVisible ? 'pt-[104px] sm:pt-[100px]' : 'pt-[64px]';

  const allFavorites = isLoaded ? getAllFavorites() : [];
  
  const filteredFavorites = allFavorites.filter(fav => 
    fav.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fav.channelName.toLowerCase().includes(searchQuery.toLowerCase())
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
    <div className="min-h-screen bg-[#fcfcfc] text-[#0f0f0f]" dir="rtl">
      <Masthead onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <SidebarGuide isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="mr-0 lg:mr-[240px] pt-[64px] pb-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-8 md:py-12"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 shadow-sm border border-red-100">
                  <Heart className="w-7 h-7 fill-current" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">المفضلة</h1>
                  <p className="text-[#606060] text-sm mt-1">مجموعتك الخاصة من الفيديوهات المميزة</p>
                </div>
              </div>

              <div className="relative group w-full md:w-96">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#606060] group-focus-within:text-red-600 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث في مفضلتك..."
                  className="w-full pr-11 pl-10 py-3.5 bg-white border border-[#e5e5e5] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all shadow-sm"
                />
                <AnimatePresence>
                  {searchQuery && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => setSearchQuery('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
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
                  <div className="w-12 h-12 border-4 border-red-100 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-[#606060] text-sm font-medium animate-pulse tracking-wide">جاري تحميل المفضلة...</p>
              </div>
            ) : allFavorites.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2.5rem] p-16 text-center border border-gray-100 shadow-sm max-w-xl mx-auto"
              >
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Heart className="w-12 h-12 text-red-200" />
                </div>
                <h2 className="text-2xl font-bold mb-4">قائمتك فارغة</h2>
                <p className="text-[#606060] mb-10 leading-relaxed text-lg">
                  لم تقم بإضافة أي فيديوهات للمفضلة بعد. ابدأ باكتشاف الفيديوهات التي تهمك وأضفها هنا.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-3 px-10 py-4 bg-red-600 text-white rounded-[1.25rem] font-bold hover:bg-red-700 active:scale-95 transition-all shadow-xl shadow-red-600/20 group"
                >
                  اكتشف الفيديوهات
                  <ArrowRight size={20} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            ) : filteredFavorites.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-[2.5rem] p-20 text-center border border-gray-100 shadow-sm"
              >
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-gray-200" />
                </div>
                <h2 className="text-2xl font-bold mb-3">لا توجد نتائج</h2>
                <p className="text-[#606060] text-lg">
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
                  {filteredFavorites.map((favorite) => (
                    <motion.div 
                      key={favorite.videoId}
                      variants={itemVariants}
                      layout
                      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                      className="group/card bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-red-100 hover:shadow-2xl hover:shadow-red-500/5 transition-all duration-500"
                    >
                      <Link href={`/watch/${favorite.videoId}`} className="block relative aspect-video overflow-hidden">
                        <img
                          src={favorite.thumbnail}
                          alt={favorite.title}
                          className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                          <div className="w-14 h-14 bg-red-600 text-white rounded-full flex items-center justify-center shadow-2xl scale-90 group-hover/card:scale-100 transition-transform duration-500 shadow-red-600/40">
                            <Play size={28} className="fill-current mr-[-2px]" />
                          </div>
                        </div>
                        <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold rounded-lg flex items-center gap-1.5">
                          <Clock size={10} />
                          {favorite.duration}
                        </div>
                      </Link>
                      
                      <div className="p-5">
                        <Link href={`/watch/${favorite.videoId}`}>
                          <h3 className="font-bold text-[#0f0f0f] text-[15px] leading-snug line-clamp-2 mb-2 group-hover/card:text-red-600 transition-colors h-10">
                            {favorite.title}
                          </h3>
                        </Link>
                        
                        <div className="flex items-center gap-2 mb-5">
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                            <Video size={12} />
                          </div>
                          <p className="text-xs font-bold text-[#606060] truncate">{favorite.channelName}</p>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <Calendar size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              {formatDate(favorite.addedAt)}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => removeFavorite(favorite.videoId)}
                            className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                            title="إزالة من المفضلة"
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

            {allFavorites.length > 0 && filteredFavorites.length > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-20 text-center"
              >
                <div className="inline-flex items-center gap-4 px-6 py-2.5 bg-gray-50 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-gray-100">
                  <span>إجمالي المفضلة: {allFavorites.length}</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
