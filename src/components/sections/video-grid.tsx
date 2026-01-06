"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Play, Clock, Eye, CheckCircle2, Check } from "lucide-react";
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
  page?: number;
}

interface VideoGridProps {
  searchQuery?: string;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onTotalPagesChange?: (total: number) => void;
  onLoadingChange?: (loading: boolean) => void;
}

// Global cache for search results
const searchCache: Record<string, { 
  videos: Video[], 
  token: string | null, 
  totalPages: number,
  timestamp: number 
}> = {};

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
  const { language, location, restrictedMode, direction, t } = useI18n();
  const { toggleWatchLater, isInWatchLater } = useWatchLater();

  const pageTokens = useRef<Record<number, string | null>>({ 1: null });
  const lastFetchedPage = useRef(0);
  const internalPageChange = useRef(false);
  const isInitialMount = useRef(true);
  const observerTarget = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Caching helper
  const getCacheKey = (query: string, page: number) => 
    `${query}-${location}-${language}-${restrictedMode}-${page}`;

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
  
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);

  const fetchVideos = useCallback(async (page: number, append: boolean = false) => {
    const cacheKey = getCacheKey(searchQuery || t("education") || "education", page);
    const cached = searchCache[cacheKey];

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      const newVideos = cached.videos.map(v => ({ ...v, page }));
      if (append) {
        setVideos(prev => {
          const existingIds = new Set(prev.map(v => v.id));
          const filtered = newVideos.filter(v => !existingIds.has(v.id));
          return [...prev, ...filtered];
        });
      } else {
        setVideos(newVideos);
      }
      if (cached.token) pageTokens.current[page + 1] = cached.token;
      if (onTotalPagesChange) onTotalPagesChange(cached.totalPages);
      lastFetchedPage.current = page;
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
      if (token) url.searchParams.set("token", token);
      
      url.searchParams.set("limit", "30");
      url.searchParams.set("page", page.toString());

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("فشل في تحميل الفيديوهات");
      
      const data = await response.json();
      const newVideos = (data.videos || []).map((v: any) => ({ ...v, page }));
      
      const totalPages = data.hasMore ? Math.max(page + 10, 100) : page;

      // Cache the result
      searchCache[cacheKey] = {
        videos: newVideos,
        token: data.continuationToken || null,
        totalPages,
        timestamp: Date.now()
      };

      if (append) {
        setVideos(prev => {
          const existingIds = new Set(prev.map(v => v.id));
          const filtered = newVideos.filter(v => !existingIds.has(v.id));
          return [...prev, ...filtered];
        });
      } else {
        setVideos(newVideos);
      }
      
      if (data.continuationToken) {
        pageTokens.current[page + 1] = data.continuationToken;
        // Preload next page
        preloadNextPage(page + 1);
      }
      
      if (onTotalPagesChange) onTotalPagesChange(totalPages);
      lastFetchedPage.current = page;

    } catch (err) {
      console.error("Error fetching videos:", err);
      setError("حدث خطأ أثناء تحميل الفيديوهات. يرجى المحاولة لاحقاً.");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, location, language, restrictedMode, onTotalPagesChange, t]);

  const preloadNextPage = useCallback(async (page: number) => {
    const cacheKey = getCacheKey(searchQuery || t("education") || "education", page);
    if (searchCache[cacheKey]) return;

    const token = pageTokens.current[page];
    if (!token) return;

    try {
      const defaultQuery = t("education") || "education";
      const q = searchQuery || defaultQuery;
      const url = new URL("/api/videos/search", window.location.origin);
      url.searchParams.set("q", q);
      url.searchParams.set("location", location);
      url.searchParams.set("language", language);
      url.searchParams.set("restricted", String(restrictedMode));
      url.searchParams.set("token", token);
      url.searchParams.set("limit", "30");
      url.searchParams.set("page", page.toString());

      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        const newVideos = (data.videos || []).map((v: any) => ({ ...v, page }));
        const totalPages = data.hasMore ? Math.max(page + 10, 100) : page;
        
        searchCache[cacheKey] = {
          videos: newVideos,
          token: data.continuationToken || null,
          totalPages,
          timestamp: Date.now()
        };
        if (data.continuationToken) {
          pageTokens.current[page + 1] = data.continuationToken;
        }
      }
    } catch (e) {
      // Preload failed silently
    }
  }, [searchQuery, location, language, restrictedMode, t]);

  useEffect(() => {
    pageTokens.current = { 1: null };
    lastFetchedPage.current = 0;
    fetchVideos(1, false);
    if (onPageChange && currentPage !== 1) {
      internalPageChange.current = true;
      onPageChange(1);
    }
  }, [searchQuery, location, restrictedMode, fetchVideos]);

  useEffect(() => {
    if (currentPage !== lastFetchedPage.current && currentPage > 0) {
      if (internalPageChange.current) {
        internalPageChange.current = false;
        return;
      }
      // If the user clicked a page in pagination, we reset and fetch that page
      fetchVideos(currentPage, false);
    }
  }, [currentPage, fetchVideos]);

  const loadMore = useCallback(() => {
    if (isLoading) return;
    const nextPage = lastFetchedPage.current + 1;
    if (pageTokens.current[nextPage]) {
      fetchVideos(nextPage, true);
    }
  }, [isLoading, fetchVideos]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && videos.length > 0) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "800px" }
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [isLoading, videos.length, loadMore]);

  // Page tracking observer to update pagination bar
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the page that is most visible in the viewport
        const visibleEntry = entries.reduce((prev, curr) => {
          return (curr.intersectionRatio > prev.intersectionRatio) ? curr : prev;
        });

        if (visibleEntry && visibleEntry.isIntersecting && onPageChange) {
          const pageNum = parseInt(visibleEntry.target.getAttribute("data-page") || "1");
          if (pageNum !== currentPage) {
            internalPageChange.current = true;
            onPageChange(pageNum);
          }
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1.0], rootMargin: "-10% 0px -10% 0px" }
    );

    Object.values(pageRefs.current).forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [videos, onPageChange, currentPage]);

  const renderVideo = (video: Video, index: number) => (
    <motion.div
      key={`${video.id}-${index}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: (index % 15) * 0.05 }}
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
  );

  // Group videos by page for intersection observing
  const videosByPage: Record<number, Video[]> = {};
  videos.forEach(v => {
    const p = v.page || 1;
    if (!videosByPage[p]) videosByPage[p] = [];
    videosByPage[p].push(v);
  });

  if (error && videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="bg-destructive/10 p-6 rounded-2xl mb-4">
          <p className="text-destructive font-medium">{error}</p>
        </div>
        <button 
          onClick={() => fetchVideos(currentPage)}
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
        <div className="flex flex-col gap-8">
          {Object.entries(videosByPage).map(([pageStr, pageVideos]) => (
            <div 
              key={pageStr} 
              data-page={pageStr}
              ref={el => { pageRefs.current[parseInt(pageStr)] = el; }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8"
            >
              {pageVideos.map((video, idx) => renderVideo(video, idx))}
            </div>
          ))}
        </div>
      )}

      <div ref={observerTarget} className="h-20 flex items-center justify-center mt-8">
        {isLoading && videos.length > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span>جاري تحميل المزيد...</span>
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
