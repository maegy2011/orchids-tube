"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Copy, 
  Check, 
  Link2,
  MessageCircle,
  Send,
  Facebook,
  Twitter,
  Mail,
  QrCode,
  Smartphone
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  videoTitle: string;
  thumbnail?: string;
}

const shareOptions = [
  {
    id: 'whatsapp',
    name: 'واتساب',
    nameEn: 'WhatsApp',
    icon: MessageCircle,
    color: 'bg-green-500',
    hoverColor: 'hover:bg-green-600',
    getUrl: (url: string, title: string) => 
      `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`,
  },
  {
    id: 'telegram',
    name: 'تيليجرام',
    nameEn: 'Telegram',
    icon: Send,
    color: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-600',
    getUrl: (url: string, title: string) => 
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    id: 'facebook',
    name: 'فيسبوك',
    nameEn: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-700',
    getUrl: (url: string, title: string) => 
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`,
  },
  {
    id: 'twitter',
    name: 'إكس (تويتر)',
    nameEn: 'X (Twitter)',
    icon: Twitter,
    color: 'bg-black',
    hoverColor: 'hover:bg-gray-800',
    getUrl: (url: string, title: string) => 
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    id: 'email',
    name: 'البريد الإلكتروني',
    nameEn: 'Email',
    icon: Mail,
    color: 'bg-gray-600',
    hoverColor: 'hover:bg-gray-700',
    getUrl: (url: string, title: string) => 
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`شاهد هذا الفيديو: ${title}\n\n${url}`)}`,
  },
];

export default function ShareModal({ isOpen, onClose, videoId, videoTitle, thumbnail }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'share' | 'embed'>('share');
  
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shortUrl = `${baseUrl}/v/${videoId}`;
  const fullUrl = `${baseUrl}/watch/${videoId}`;
  const embedCode = `<iframe width="560" height="315" src="${baseUrl}/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(type === 'link' ? 'تم نسخ الرابط' : 'تم نسخ كود التضمين', {
        icon: <Check className="w-4 h-4 text-green-500" />,
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('فشل النسخ');
    }
  };

  const handleShare = (option: typeof shareOptions[0]) => {
    const url = option.getUrl(shortUrl, videoTitle);
    window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url } }, "*");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: videoTitle,
          text: `شاهد: ${videoTitle}`,
          url: shortUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          toast.error('فشلت المشاركة');
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2100] flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-gray-900 w-full sm:w-[480px] sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          dir="rtl"
        >
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-xl font-black text-gray-900 dark:text-white">مشاركة الفيديو</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-500" />
            </button>
          </div>

          <div className="p-6">
            {thumbnail && (
              <div className="flex items-center gap-4 mb-6 bg-gray-50 dark:bg-gray-800 rounded-2xl p-3">
                <img 
                  src={thumbnail} 
                  alt={videoTitle} 
                  className="w-24 h-14 object-cover rounded-xl"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">{videoTitle}</p>
                </div>
              </div>
            )}

            <div className="flex border-b border-gray-100 dark:border-gray-800 mb-6">
              <button
                onClick={() => setActiveTab('share')}
                className={cn(
                  "flex-1 py-3 text-sm font-bold transition-all relative",
                  activeTab === 'share' 
                    ? 'text-red-600' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                )}
              >
                مشاركة
                {activeTab === 'share' && (
                  <motion.div 
                    layoutId="shareTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" 
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab('embed')}
                className={cn(
                  "flex-1 py-3 text-sm font-bold transition-all relative",
                  activeTab === 'embed' 
                    ? 'text-red-600' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                )}
              >
                تضمين
                {activeTab === 'embed' && (
                  <motion.div 
                    layoutId="shareTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" 
                  />
                )}
              </button>
            </div>

            {activeTab === 'share' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {typeof navigator !== 'undefined' && navigator.share && (
                  <button
                    onClick={handleNativeShare}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-red-500/20 transition-all active:scale-[0.98]"
                  >
                    <Smartphone size={22} />
                    مشاركة عبر التطبيقات
                  </button>
                )}

                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">مشاركة عبر</p>
                  <div className="grid grid-cols-5 gap-3">
                    {shareOptions.map((option) => (
                      <motion.button
                        key={option.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleShare(option)}
                        className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                      >
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-all shadow-lg",
                          option.color,
                          option.hoverColor
                        )}>
                          <option.icon size={26} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                          {option.name}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">نسخ الرابط</p>
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-2xl p-2 border border-gray-100 dark:border-gray-700">
                    <div className="flex-1 px-3">
                      <p className="text-sm font-mono text-gray-600 dark:text-gray-300 truncate" dir="ltr">
                        {shortUrl}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopy(shortUrl, 'link')}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all",
                        copied 
                          ? "bg-green-500 text-white" 
                          : "bg-red-600 text-white hover:bg-red-700"
                      )}
                    >
                      {copied ? (
                        <>
                          <Check size={16} />
                          تم النسخ
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          نسخ
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'embed' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">كود التضمين</p>
                  <div className="bg-gray-900 rounded-2xl p-4 overflow-x-auto">
                    <code className="text-sm text-green-400 font-mono whitespace-pre-wrap break-all" dir="ltr">
                      {embedCode}
                    </code>
                  </div>
                </div>
                
                <button
                  onClick={() => handleCopy(embedCode, 'embed')}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all",
                    copied 
                      ? "bg-green-500 text-white" 
                      : "bg-red-600 text-white hover:bg-red-700"
                  )}
                >
                  {copied ? (
                    <>
                      <Check size={18} />
                      تم نسخ الكود
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      نسخ كود التضمين
                    </>
                  )}
                </button>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>ملاحظة:</strong> الصق هذا الكود في موقعك أو مدونتك لتضمين الفيديو.
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
