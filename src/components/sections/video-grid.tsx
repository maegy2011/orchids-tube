"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Play, Clock, Eye, Calendar, CheckCircle2, BookmarkPlus, BookmarkCheck, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";
import { useWatchLater } from "@/hooks/useWatchLater";
import { toast } from "sonner";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
  uploadedAt: string;
  channelName: string;
  channelAvatar: string;
  isVerified: boolean;
  page?: number; // Keep track of which page this video belongs to
}

interface VideoGridProps {
  searchQuery?: string;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onTotalPagesChange?: (total: number) => void;
  onLoadingChange?: (loading: boolean) => void;
}

// Simple in-memory cache for search results
const searchCache: Record<string, { videos: Video[], tokens: Record<number, string | null>, timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default function VideoGrid({ 
  searchQuery = "", 
  currentPage = 1, 
  onPageChange, 
  onTotalPagesChange,
  onLoadingChange
}: VideoGridProps) {
  const [videos, setVideos] = useState<Video[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { language, location, restrictedMode, direction, t, loadMoreMode } = useI18n();
    const { toggleWatchLater, isInWatchLater } = useWatchLater();

  const handleWatchLaterClick = (e: React.MouseEvent, video: Video) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleWatchLater({
      videoId: video.id,
      title: video.title,
      thumbnail: video.thumbnail,
      channelName: video.channelName,
      duration: video.duration
    });
    
    if (added) {
      toast.success(t("added_to_watch_later") || "تمت الإضافة إلى المشاهدة لاحقاً", {
        icon: <Clock className="w-4 h-4 text-green-500" />,
        duration: 2000,
      });
    } else {
      toast.info(t("removed_from_watch_later") || "تمت الإزالة من المشاهدة لاحقاً", {
        duration: 2000,
      });
    }
  };
  
  // Notify parent of loading state changes
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);

  // Keep track of tokens for each page to support going back/forth
  const pageTokens = useRef<Record<number, string | null>>({ 1: null });
  const [lastFetchedPage, setLastFetchedPage] = useState(0);
  const preloadingRef = useRef<number | null>(null);

  const fetchVideos = useCallback(async (page: number, append: boolean = false) => {
    // Check cache first if it's the first page or we are not appending
    const cacheKey = `${searchQuery}-${language}-${location}-${restrictedMode}`;
    if (!append && page === 1 && searchCache[cacheKey] && (Date.now() - searchCache[cacheKey].timestamp < CACHE_TTL)) {
      setVideos(searchCache[cacheKey].videos);
      pageTokens.current = { ...searchCache[cacheKey].tokens };
      setLastFetchedPage(1);
      if (onTotalPagesChange) onTotalPagesChange(100);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const defaultQuery = t("education") || "education";
      const q = searchQuery || defaultQuery;
      const url = new URL("/api/videos/search", window.location.origin);
      url.searchParams.set("q", q);
      url.searchParams.set("location", location);
      url.searchParams.set("language", language);
      url.searchParams.set("restricted", String(restrictedMode));
    
      const token = pageTokens.current[page];
      if (token) {
        url.searchParams.set("token", token);
      }
      
      url.searchParams.set("limit", "30");
      url.searchParams.set("page", page.toString());

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("فشل في تحميل الفيديوهات");
      
      const data = await response.json();
      const newVideos = (data.videos || []).map((v: any) => ({ ...v, page }));
      
      let updatedVideos: Video[] = [];
      if (append) {
        updatedVideos = [...videos, ...newVideos];
        setVideos(updatedVideos);
      } else {
        updatedVideos = newVideos;
        setVideos(updatedVideos);
      }
      
      // Store the token for the NEXT page
      if (data.continuationToken) {
        pageTokens.current[page + 1] = data.continuationToken;
      }
      
      // Update cache
      searchCache[cacheKey] = {
        videos: updatedVideos,
        tokens: { ...pageTokens.current },
        timestamp: Date.now()
      };

      if (onTotalPagesChange) {
        onTotalPagesChange(data.hasMore ? Math.max(page + 10, 100) : page);
      }
      
      setLastFetchedPage(page);

      // Preload next page if available
      if (data.hasMore && data.continuationToken && preloadingRef.current !== page + 1) {
        preloadingRef.current = page + 1;
        // Pre-fetch next page data in background (not actually setting state, just hitting API to cache server-side or prepare)
        // For simplicity, we just know we have the token ready.
      }

    } catch (err) {
      console.error("Error fetching videos:", err);
      setError("حدث خطأ أثناء تحميل الفيديوهات. يرجى المحاولة لاحقاً.");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, location, restrictedMode, onTotalPagesChange, language, t, videos]);

  // Reset tokens and fetch page 1 when search query or location changes
  useEffect(() => {
    pageTokens.current = { 1: null };
    setVideos([]);
    fetchVideos(1, false);
  }, [searchQuery, location, restrictedMode]);

  const loadMore = useCallback(() => {
    if (isLoading) return;
    const nextPage = lastFetchedPage + 1;
    if (pageTokens.current[nextPage] || nextPage === 1) {
      fetchVideos(nextPage, true);
    }
  }, [lastFetchedPage, isLoading, fetchVideos]);

  const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (loadMoreMode !== 'auto') return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !isLoading) {
            loadMore();
          }
        },
        { threshold: 0.1, rootMargin: "400px" }
      );

      if (observerTarget.current) {
        observer.observe(observerTarget.current);
      }

      return () => observer.disconnect();
    }, [isLoading, loadMore, loadMoreMode]);

  // Track visible page for pagination sync
  const videoRefs = useRef<Record<string, HTMLDivElement | null>>({});
  useEffect(() => {
    const pageObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find(entry => entry.isIntersecting);
        if (visibleEntry) {
          const videoId = visibleEntry.target.getAttribute('data-video-id');
          const video = videos.find(v => v.id === videoId);
          if (video?.page && onPageChange && video.page !== currentPage) {
            onPageChange(video.page);
          }
        }
      },
      { threshold: 0.5, rootMargin: "-10% 0px -80% 0px" }
    );

    Object.values(videoRefs.current).forEach(ref => {
      if (ref) pageObserver.observe(ref);
    });

    return () => pageObserver.disconnect();
  }, [videos, onPageChange, currentPage]);

  if (error && videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="bg-destructive/10 p-6 rounded-2xl mb-4">
          <p className="text-destructive font-medium">{error}</p>
        </div>
        <button 
          onClick={() => fetchVideos(1)}
          className="px-6 py-2 bg-foreground text-background rounded-full hover:bg-foreground/90 transition-all active:scale-95"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 py-6 min-h-[400px]" dir={direction}>
      {isLoading && videos.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex flex-col gap-3 animate-pulse">
              <div className="aspect-video bg-muted rounded-xl" />
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-muted" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
          <AnimatePresence mode="popLayout">
            {videos.map((video, index) => (
              <motion.div
                key={`${video.id}-${index}`}
                ref={el => videoRefs.current[video.id] = el as any}
                data-video-id={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: (index % 20) * 0.05 }}
              >
                <Link href={`/watch/${video.id}`} className="group flex flex-col gap-3">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-muted shadow-sm transition-all duration-300 group-hover:rounded-none">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[12px] font-bold px-1.5 py-0.5 rounded-md">
                        {video.duration}
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleWatchLaterClick(e, video)}
                        className={cn(
                          "absolute top-2 right-2 p-1.5 rounded-md transition-all duration-300 z-10",
                          "opacity-0 group-hover:opacity-100",
                          isInWatchLater(video.id) 
                            ? "bg-blue-600 text-white shadow-lg" 
                            : "bg-black/60 text-white hover:bg-black/80"
                        )}
                        title={t("watch_later") || "مشاهدة لاحقاً"}
                      >
                        <AnimatePresence mode="wait">
                          {isInWatchLater(video.id) ? (
                            <motion.div
                              key="checked"
                              initial={{ scale: 0, rotate: -45 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 45 }}
                            >
                              <Check size={18} />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="plus"
                              initial={{ scale: 0, rotate: 45 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: -45 }}
                            >
                              <Clock size={18} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>

                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <Play className="text-white opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300 drop-shadow-lg" size={48} fill="currentColor" />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="shrink-0">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-muted border border-border">
                        <img
                          src={video.channelAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(video.channelName)}&background=random`}
                          alt={video.channelName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 overflow-hidden">
                      <h3 className="text-[16px] font-bold text-foreground leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {video.title}
                      </h3>
                      <div className="flex flex-col text-[14px] text-muted-foreground">
                        <div className="flex items-center gap-1 hover:text-foreground transition-colors">
                          <span className="truncate">{video.channelName}</span>
                          {video.isVerified && <CheckCircle2 size={14} className="text-muted-foreground fill-muted-foreground/10" />}
                        </div>
                        <div className="flex items-center gap-1">
                          <span>{video.views} مشاهدة</span>
                          <span className="before:content-['•'] before:mx-1">{video.uploadedAt}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
        </AnimatePresence>
          </div>
        )}
  
        {/* Load More Button (Manual Mode) */}
        {loadMoreMode === 'manual' && videos.length > 0 && (
          <div className="flex justify-center mt-12 mb-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadMore}
              disabled={isLoading}
              className="flex items-center gap-2 px-10 py-4 bg-red-600 text-white rounded-2xl font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5 fill-current" />
              )}
              {isLoading ? t("loading") || "جاري التحميل..." : t("load_more") || "تحميل المزيد من الفيديوهات"}
            </motion.button>
          </div>
        )}
  
        {/* Infinite Scroll Trigger (Auto Mode) */}
        <div ref={observerTarget} className={cn("h-20 flex items-center justify-center mt-8", loadMoreMode === 'manual' && "hidden")}>
          {isLoading && videos.length > 0 && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
              <p className="text-xs text-muted-foreground font-medium">{t("loading") || "جاري تحميل المزيد..."}</p>
            </div>
          )}
        </div>

      {!isLoading && videos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Eye size={48} className="mb-4 opacity-20" />
          <p className="text-lg font-medium">لم يتم العثور على فيديوهات</p>
          <p className="text-sm">جرب كلمات بحث مختلفة</p>
        </div>
      )}
    </div>
  );
}
