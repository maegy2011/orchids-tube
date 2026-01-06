"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  StickyNote, 
  Play, 
  Trash2, 
  Edit2, 
  Search, 
  ArrowRight,
  Video,
  Check,
  X,
  History,
  Calendar,
  Tag as TagIcon,
  Filter,
  RefreshCw,
  Copy,
  Share2,
  Download,
  MoreVertical,
  Settings2,
  CheckSquare,
  Square,
  DownloadCloud,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n-context';
import { useNotes } from '@/hooks/useNotes';
import { VideoNote } from '@/lib/types';
import Masthead from '@/components/sections/masthead';
import SidebarGuide from '@/components/sections/sidebar-guide';
import ConfirmModal from '@/components/ui/confirm-modal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getFormattedGregorianDate, getFormattedHijriDate, getDaysUntilRamadan } from '@/lib/date-utils';

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function parseTime(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}


export default function NotesPage() {
  const { getAllNotes, deleteNote, updateNote, isLoaded } = useNotes();
  const { showGregorianDate, showHijriDate, hijriOffset, language, direction, t, showRamadanCountdown } = useI18n();
  const isRTL = direction === 'rtl';
  const [daysUntilRamadan, setDaysUntilRamadan] = useState<number | null>(null);

  useEffect(() => {
    setDaysUntilRamadan(getDaysUntilRamadan());
  }, []);

  const isRamadanCountdownVisible = showRamadanCountdown && daysUntilRamadan !== null && daysUntilRamadan > 0;
  const mainPaddingTop = isRamadanCountdownVisible ? 'pt-[104px] sm:pt-[100px]' : 'pt-[64px]';

  const formatDate = (dateString: string): string => {
      const date = new Date(dateString);
      const parts = [];

      // If RTL or Arabic, show Hijri first if both are enabled
      if (isRTL || language === 'ar') {
        if (showHijriDate) {
          parts.push(getFormattedHijriDate(language, hijriOffset, date));
        }
        if (showGregorianDate) {
          parts.push(getFormattedGregorianDate(language, date));
        }
      } else {
        if (showGregorianDate) {
          parts.push(getFormattedGregorianDate(language, date));
        }
        if (showHijriDate) {
          parts.push(getFormattedHijriDate(language, hijriOffset, date));
        }
      }

      if (parts.length === 0) return '';
      // Join with a cleaner separator if both are present
      return parts.join(' | ');
    };


  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editHashtags, setEditHashtags] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);
  const [isManageMode, setIsManageMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  
  const allNotes = isLoaded ? getAllNotes() : [];
  
  const uniqueHashtags = useMemo(() => {
    const tags = new Set<string>();
    allNotes.forEach(note => {
      note.hashtags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [allNotes]);

  const toggleNoteSelection = (id: string) => {
    const newSelection = new Set(selectedNotes);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedNotes(newSelection);
  };

  const selectAll = () => {
    if (selectedNotes.size === filteredNotes.length) {
      setSelectedNotes(new Set());
    } else {
      setSelectedNotes(new Set(filteredNotes.map(n => n.id)));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('تم نسخ النص إلى الحافظة');
  };

  const shareNote = (note: VideoNote) => {
    const shareUrl = `${window.location.origin}/watch/${note.videoId}?t=${note.startTime}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('تم نسخ رابط المشاركة');
  };

  const exportNotes = (notesToExport: VideoNote[]) => {
    const content = notesToExport.map(n => {
      return `[${formatTime(n.startTime)} - ${formatTime(n.endTime)}] ${n.videoTitle}\n${n.content}\n${n.hashtags?.join(' ') || ''}\n---\n`;
    }).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notes-export-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('تم تصدير الملاحظات بنجاح');
  };

  const bulkDelete = () => {
    if (selectedNotes.size === 0) return;
    if (confirm(`هل أنت متأكد من حذف ${selectedNotes.size} ملاحظة؟`)) {
      selectedNotes.forEach(id => deleteNote(id));
      setSelectedNotes(new Set());
      setIsManageMode(false);
      toast.success('تم حذف الملاحظات المختارة');
    }
  };

  const filteredNotes = useMemo(() => {
    return allNotes.filter(note => {
      const matchesSearch = 
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.videoTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.hashtags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTag = !selectedTag || note.hashtags?.includes(selectedTag);
      
      return matchesSearch && matchesTag;
    });
  }, [allNotes, searchQuery, selectedTag]);

  const groupedNotes = useMemo(() => {
    return filteredNotes.reduce((acc, note) => {
      if (!acc[note.videoId]) {
        acc[note.videoId] = {
          videoId: note.videoId,
          videoTitle: note.videoTitle,
          notes: [],
        };
      }
      acc[note.videoId].notes.push(note);
      return acc;
    }, {} as Record<string, { videoId: string; videoTitle: string; notes: VideoNote[] }>);
  }, [filteredNotes]);

  const startEditing = (note: VideoNote) => {
    setEditingNote(note.id);
    setEditContent(note.content);
    setEditHashtags(note.hashtags?.join(' ') || '');
    setEditStartTime(formatTime(note.startTime));
    setEditEndTime(formatTime(note.endTime));
  };

  const cancelEditing = () => {
    setEditingNote(null);
    setEditContent('');
    setEditHashtags('');
    setEditStartTime('');
    setEditEndTime('');
  };

  const saveEdit = () => {
    if (!editingNote || !editContent.trim()) return;
    
    const hashtagsArray = editHashtags.split(/\s+/).filter(h => h.startsWith('#')).map(h => h.trim());

    updateNote(editingNote, {
      content: editContent,
      hashtags: hashtagsArray,
      startTime: parseTime(editStartTime),
      endTime: parseTime(editEndTime),
    });
    
    cancelEditing();
  };

  const handleDeleteRequest = (noteId: string) => {
    setNoteToDeleteId(noteId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (noteToDeleteId) {
      deleteNote(noteToDeleteId);
      setIsDeleteModalOpen(false);
      setNoteToDeleteId(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTag(null);
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
      opacity: 1
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#0f0f0f]" dir={direction}>
      <Masthead onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <SidebarGuide isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className={`${isRTL ? 'mr-0 lg:mr-[240px]' : 'ml-0 lg:ml-[240px]'} ${mainPaddingTop} pb-24 px-4 md:px-8 transition-all duration-300`}>
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-8 md:py-12"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 shadow-sm border border-red-100">
                  <StickyNote className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">ملاحظاتي</h1>
                  <p className="text-[#606060] text-sm mt-1">إدارة وتنظيم أفكارك من الفيديوهات</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsManageMode(!isManageMode);
                    setSelectedNotes(new Set());
                  }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold transition-all border shadow-sm",
                    isManageMode 
                      ? "bg-red-600 text-white border-red-600" 
                      : "bg-white text-[#0f0f0f] border-[#e5e5e5] hover:border-red-200"
                  )}
                >
                  <Settings2 size={18} />
                  {isManageMode ? 'إلغاء الإدارة' : 'إدارة الملاحظات'}
                </button>

                <div className="relative group w-full md:w-80">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#606060] group-focus-within:text-red-600 transition-colors" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث في الملاحظات أو الأوسمة..."
                    className="w-full pr-11 pl-10 py-3 bg-white border border-[#e5e5e5] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all shadow-sm"
                  />
                  <AnimatePresence>
                    {searchQuery && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => setSearchQuery('')}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X size={14} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {isManageMode && filteredNotes.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-4 bg-white border border-[#e5e5e5] rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={selectAll}
                    className="flex items-center gap-2 text-sm font-bold text-[#606060] hover:text-red-600 transition-colors"
                  >
                    {selectedNotes.size === filteredNotes.length ? <CheckSquare size={18} /> : <Square size={18} />}
                    {selectedNotes.size === filteredNotes.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                  </button>
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                    تم تحديد {selectedNotes.size}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => exportNotes(filteredNotes.filter(n => selectedNotes.has(n.id)))}
                    disabled={selectedNotes.size === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-[#0f0f0f] rounded-xl text-xs font-bold hover:bg-gray-100 disabled:opacity-50 transition-all border border-[#e5e5e5]"
                  >
                    <DownloadCloud size={16} />
                    تصدير المختار
                  </button>
                  <button
                    onClick={bulkDelete}
                    disabled={selectedNotes.size === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 disabled:opacity-50 transition-all border border-red-100"
                  >
                    <Trash2 size={16} />
                    حذف المختار
                  </button>
                </div>
              </motion.div>
            )}

            {uniqueHashtags.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4 px-1">
                  <TagIcon size={14} className="text-[#606060]" />
                  <span className="text-xs font-bold text-[#606060] uppercase tracking-wider">تصفية حسب الوسم</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedTag(null)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                      !selectedTag 
                        ? "bg-red-600 text-white border-red-600 shadow-md shadow-red-600/10" 
                        : "bg-white text-[#606060] border-[#e5e5e5] hover:border-red-200 hover:text-red-600"
                    )}
                  >
                    الكل
                  </button>
                  {uniqueHashtags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                        selectedTag === tag
                          ? "bg-red-600 text-white border-red-600 shadow-md shadow-red-600/10"
                          : "bg-white text-[#606060] border-[#e5e5e5] hover:border-red-200 hover:text-red-600"
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!isLoaded ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-red-100 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-[#606060] text-sm font-medium animate-pulse">جاري تحميل ملاحظاتك...</p>
              </div>
            ) : allNotes.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl p-12 text-center border border-[#e5e5e5] shadow-sm max-w-lg mx-auto"
              >
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <History className="w-10 h-10 text-gray-300" />
                </div>
                <h2 className="text-xl font-bold mb-3">لا توجد ملاحظات بعد</h2>
                <p className="text-[#606060] mb-8 leading-relaxed">
                  سجل أهم اللحظات والأفكار أثناء مشاهدة الفيديوهات لتظهر هنا وتتمكن من الرجوع إليها بسهولة.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-600/20"
                >
                  <ArrowRight size={18} className="rotate-180" />
                  اكتشف الفيديوهات
                </Link>
              </motion.div>
            ) : filteredNotes.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-3xl p-16 text-center border border-[#e5e5e5] shadow-sm"
              >
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-300" />
                </div>
                <h2 className="text-xl font-bold mb-2">لا توجد نتائج</h2>
                <p className="text-[#606060] mb-6">
                  لم يتم العثور على ملاحظات تطابق بحثك أو التصفية الحالية.
                </p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-[#0f0f0f] rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  <RefreshCw size={16} />
                  إعادة تعيين الفلاتر
                </button>
              </motion.div>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 gap-12"
              >
                {Object.values(groupedNotes).map((group) => (
                  <motion.div 
                    key={group.videoId}
                    variants={itemVariants}
                    className="group"
                  >
                    <div className="flex items-center gap-3 mb-6 px-2">
                      <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white shrink-0 shadow-lg shadow-gray-900/10">
                        <Video size={18} />
                      </div>
                      <Link 
                        href={`/watch/${group.videoId}`}
                        className="font-bold text-xl hover:text-red-600 transition-colors line-clamp-1 flex-1"
                      >
                        {group.videoTitle}
                      </Link>
                      <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full shrink-0 border border-gray-100">
                        {group.notes.length} ملاحظات
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {group.notes.map((note) => (
                        <motion.div 
                          key={note.id}
                          layout
                          className={cn(
                            "relative p-6 rounded-[32px] transition-all border group/card flex flex-col h-full",
                            editingNote === note.id 
                              ? "bg-white border-red-200 ring-4 ring-red-50 shadow-2xl z-10" 
                              : "bg-white border-gray-100 hover:border-red-200 hover:shadow-xl hover:-translate-y-1",
                            isManageMode && selectedNotes.has(note.id) && "ring-2 ring-red-500 border-red-500"
                          )}
                          onClick={() => isManageMode && toggleNoteSelection(note.id)}
                        >
                          {isManageMode && (
                            <div className="absolute top-4 right-4 z-20">
                              {selectedNotes.has(note.id) ? (
                                <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-600/20">
                                  <Check size={14} strokeWidth={3} />
                                </div>
                              ) : (
                                <div className="w-6 h-6 bg-white border-2 border-gray-200 rounded-full" />
                              )}
                            </div>
                          )}

                          {editingNote === note.id ? (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-red-600 uppercase tracking-wider">تعديل الملاحظة</span>
                                <button onClick={(e) => { e.stopPropagation(); cancelEditing(); }} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
                                  <X size={16} />
                                </button>
                              </div>
                                <textarea
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  className="w-full p-4 bg-gray-50 border-none rounded-2xl resize-none h-32 text-sm focus:ring-2 focus:ring-red-500/10 transition-all font-medium leading-relaxed mb-4"
                                  dir="rtl"
                                  autoFocus
                                />
                                <div className="mb-4">
                                  <input
                                    type="text"
                                    value={editHashtags}
                                    onChange={(e) => setEditHashtags(e.target.value)}
                                    placeholder="أضف وسوم (مثال: #تعليم #برمجة)"
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-red-500/10"
                                    dir="rtl"
                                  />
                                </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-[#606060] px-1 uppercase tracking-widest">{t('start')}</label>
                                  <input
                                    type="text"
                                    value={editStartTime}
                                    onChange={(e) => setEditStartTime(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-500/10"
                                    placeholder="0:00"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-[#606060] px-1 uppercase tracking-widest">{t('end')}</label>
                                  <input
                                    type="text"
                                    value={editEndTime}
                                    onChange={(e) => setEditEndTime(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-500/10"
                                    placeholder="0:00"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-2 pt-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); saveEdit(); }}
                                  disabled={!editContent.trim()}
                                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg shadow-red-600/20"
                                >
                                  <Check size={18} />
                                  حفظ التغييرات
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between gap-4 mb-5">
                                <Link
                                  href={`/watch/${note.videoId}?t=${note.startTime}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors shadow-sm border border-red-100"
                                >
                                  <Play size={14} fill="currentColor" />
                                  <span className="text-xs font-bold font-mono">
                                    {formatTime(note.startTime)} - {formatTime(note.endTime)}
                                  </span>
                                </Link>
                                
                                <div className="flex items-center gap-1 transition-all">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); copyToClipboard(note.content); }}
                                    className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                    title="نسخ النص"
                                  >
                                    <Copy size={16} />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); shareNote(note); }}
                                    className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                                    title="مشاركة الرابط"
                                  >
                                    <Share2 size={16} />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); startEditing(note); }}
                                    className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                                    title="تعديل"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteRequest(note.id); }}
                                    className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                    title="حذف"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>

                                <p className="text-[#0f0f0f] text-[15px] font-medium leading-[1.8] mb-6 whitespace-pre-wrap flex-1">
                                  {note.content}
                                </p>
                                
                                {note.hashtags && note.hashtags.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mb-6">
                                    {note.hashtags.map((tag, i) => (
                                      <button 
                                        key={i} 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedTag(tag === selectedTag ? null : tag);
                                        }}
                                        className={cn(
                                          "text-[10px] font-bold px-3 py-1 rounded-full border transition-all",
                                          selectedTag === tag
                                            ? "bg-red-600 text-white border-red-600"
                                            : "text-red-600 bg-red-50 border-red-100 hover:bg-red-100"
                                        )}
                                      >
                                        {tag}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              
                              <div className="flex items-center gap-3 pt-5 border-t border-gray-50 mt-auto">
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0 border border-gray-100">
                                  <Calendar size={14} />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-bold text-gray-400">
                                    {t('addedOn')} {formatDate(note.createdAt)}
                                  </span>
                                  {note.updatedAt && note.updatedAt !== note.createdAt && (
                                    <span className="text-[10px] font-medium text-gray-400/80">
                                      {t('lastUpdated')} {formatDate(note.updatedAt)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {allNotes.length > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-20 text-center"
              >
                <div className="inline-flex items-center gap-4 px-8 py-3 bg-white border border-[#e5e5e5] rounded-full text-[11px] font-bold text-gray-500 uppercase tracking-widest shadow-sm">
                  <span className="flex items-center gap-1.5">
                    <StickyNote size={14} className="text-red-500" />
                    {allNotes.length} ملاحظة
                  </span>
                  <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
                  <span className="flex items-center gap-1.5">
                    <Video size={14} className="text-gray-900" />
                    {Object.keys(groupedNotes).length} فيديوهات
                  </span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setNoteToDeleteId(null);
        }}
        onConfirm={confirmDelete}
        title="حذف الملاحظة"
        description="هل أنت متأكد من رغبتك في حذف هذه الملاحظة؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        variant="danger"
      />
    </div>
  );
}
