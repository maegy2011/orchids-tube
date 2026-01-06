"use client";

import React, { useState, useEffect } from 'react';
import { X, Download, Film, Music, Loader2, ExternalLink, Copy, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface DownloadModalProps {
  videoId: string;
  videoTitle: string;
  onClose: () => void;
}

interface DownloadFormat {
  itag: number;
  quality: string;
  container: string;
  size: string;
}

interface FormatsResponse {
  title: string;
  duration: string;
  thumbnail: string;
  videoFormats: DownloadFormat[];
  audioFormats: DownloadFormat[];
  error?: string;
}

export default function DownloadModal({ videoId, videoTitle, onClose }: DownloadModalProps) {
  const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video');
  const [selectedQuality, setSelectedQuality] = useState<string>('720');
  const [loading, setLoading] = useState(false);
  const [fetchingFormats, setFetchingFormats] = useState(true);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [formats, setFormats] = useState<FormatsResponse | null>(null);
  const [downloadInfo, setDownloadInfo] = useState<{quality: string; fileSize: string; container: string} | null>(null);

  useEffect(() => {
    fetchFormats();
  }, [videoId]);

  const fetchFormats = async () => {
    setFetchingFormats(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/download?videoId=${videoId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'فشل جلب معلومات الفيديو');
      }
      
      setFormats(data);
      
      if (data.videoFormats?.length > 0) {
        const defaultFormat = data.videoFormats.find((f: DownloadFormat) => f.quality?.includes('720')) || data.videoFormats[0];
        setSelectedQuality(defaultFormat.quality);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setFetchingFormats(false);
    }
  };

  const handleTabChange = (tab: 'video' | 'audio') => {
    setActiveTab(tab);
    setDownloadUrl(null);
    setError(null);
    setDownloadInfo(null);
    
    if (formats) {
      if (tab === 'video' && formats.videoFormats?.length > 0) {
        const defaultFormat = formats.videoFormats.find(f => f.quality?.includes('720')) || formats.videoFormats[0];
        setSelectedQuality(defaultFormat.quality);
      } else if (tab === 'audio' && formats.audioFormats?.length > 0) {
        setSelectedQuality(formats.audioFormats[0].quality);
      }
    }
  };

  const generateDownloadLink = async () => {
    if (!selectedQuality) return;

    setLoading(true);
    setError(null);
    setDownloadUrl(null);

    try {
      const qualityNumber = selectedQuality.replace(/[^\d]/g, '');
      
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          quality: qualityNumber,
          type: activeTab,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'فشل إنشاء رابط التحميل');
      }

      setDownloadUrl(data.url);
      setDownloadInfo({
        quality: data.quality,
        fileSize: data.fileSize,
        container: data.container,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!downloadUrl) return;
    try {
      await navigator.clipboard.writeText(downloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = downloadUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openDownload = () => {
    if (downloadUrl) {
      window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: downloadUrl } }, "*");
    }
  };

  const currentFormats = activeTab === 'video' ? formats?.videoFormats : formats?.audioFormats;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-[#e5e5e5]">
          <h2 className="text-lg font-bold text-[#0f0f0f]">تحميل الفيديو</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#f2f2f2] rounded-full transition-colors"
          >
            <X size={20} className="text-[#606060]" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-[#606060] mb-4 line-clamp-2">{videoTitle}</p>

          {fetchingFormats ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-red-600 mb-3" />
              <p className="text-sm text-[#606060]">جاري جلب معلومات الفيديو...</p>
            </div>
          ) : error && !formats ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                <AlertCircle size={24} className="text-red-600" />
              </div>
              <p className="text-sm text-red-600 text-center mb-4">{error}</p>
              <button
                onClick={fetchFormats}
                className="flex items-center gap-2 px-4 py-2 bg-[#f2f2f2] text-[#0f0f0f] rounded-lg hover:bg-[#e5e5e5] transition-colors"
              >
                <RefreshCw size={18} />
                إعادة المحاولة
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => handleTabChange('video')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                    activeTab === 'video'
                      ? 'bg-red-600 text-white'
                      : 'bg-[#f2f2f2] text-[#0f0f0f] hover:bg-[#e5e5e5]'
                  }`}
                >
                  <Film size={18} />
                  فيديو
                </button>
                <button
                  onClick={() => handleTabChange('audio')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                    activeTab === 'audio'
                      ? 'bg-red-600 text-white'
                      : 'bg-[#f2f2f2] text-[#0f0f0f] hover:bg-[#e5e5e5]'
                  }`}
                >
                  <Music size={18} />
                  صوت فقط
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium text-[#0f0f0f]">اختر الجودة</label>
                {currentFormats && currentFormats.length > 0 ? (
                  <div className="grid gap-2 max-h-[200px] overflow-y-auto">
                    {currentFormats.map((format, index) => (
                      <button
                        key={`${format.itag}-${index}`}
                        onClick={() => {
                          setSelectedQuality(format.quality);
                          setDownloadUrl(null);
                          setError(null);
                        }}
                        className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
                          selectedQuality === format.quality
                            ? 'border-red-600 bg-red-50 text-red-600'
                            : 'border-[#e5e5e5] hover:border-[#ccc] text-[#0f0f0f]'
                        }`}
                      >
                        <span className="font-medium">{format.quality}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#606060]">{format.size}</span>
                          <span className="text-xs text-[#606060] uppercase bg-[#f2f2f2] px-2 py-0.5 rounded">
                            {format.container}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-[#606060] py-4">
                    لا تتوفر صيغ {activeTab === 'video' ? 'للفيديو' : 'للصوت'}
                  </p>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {downloadUrl ? (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 text-sm font-medium mb-1">تم إنشاء رابط التحميل!</p>
                    {downloadInfo && (
                      <p className="text-green-600 text-xs mb-2">
                        الجودة: {downloadInfo.quality} • الحجم: {downloadInfo.fileSize} • الصيغة: {downloadInfo.container}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={openDownload}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors"
                      >
                        <ExternalLink size={18} />
                        فتح رابط التحميل
                      </button>
                      <button
                        onClick={copyToClipboard}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#f2f2f2] text-[#0f0f0f] rounded-lg font-medium text-sm hover:bg-[#e5e5e5] transition-colors"
                      >
                        {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setDownloadUrl(null);
                      setError(null);
                      setDownloadInfo(null);
                    }}
                    className="w-full py-2.5 text-[#606060] text-sm hover:text-[#0f0f0f] transition-colors"
                  >
                    اختيار جودة مختلفة
                  </button>
                </div>
              ) : (
                <button
                  onClick={generateDownloadLink}
                  disabled={loading || !selectedQuality || !currentFormats?.length}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      جاري إنشاء الرابط...
                    </>
                  ) : (
                    <>
                      <Download size={20} />
                      إنشاء رابط التحميل
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>

        <div className="px-4 py-3 bg-[#f9f9f9] border-t border-[#e5e5e5]">
          <p className="text-xs text-[#606060] text-center">
            التحميل متاح للمحتوى العام فقط • الروابط صالحة لمدة 6 ساعات
          </p>
        </div>
      </div>
    </div>
  );
}
