/* Video Notes Enhancement */
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import YouTube, { YouTubeProps } from 'react-youtube';
import { 
  Share2, 
  Download, 
  MoreHorizontal,
  Plus,
  Play,
  Pause,
  X,
  Clock,
  Trash2,
  Edit2,
  Check,
  ArrowRight,
  Music,
  Search,
  Square,
  Circle,
  AlertCircle,
  Repeat,
  Quote,
  MessageSquare,
  Maximize,
    Sparkles,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    ShieldOff,
    Zap,
  } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { VideoDetails, VideoNote } from '@/lib/types';
import { useNotes } from '@/hooks/useNotes';
import { useWatchLater } from '@/hooks/useWatchLater';
import { useUser } from '@/hooks/use-user';
import { useI18n } from '@/lib/i18n-context';
import Masthead from '@/components/sections/masthead';
import SidebarGuide from '@/components/sections/sidebar-guide';
import DownloadModal from '@/components/ui/download-modal';
import BackgroundPlayer from '@/components/ui/background-player';
import ConfirmModal from '@/components/ui/confirm-modal';

import AlternativePlayer from '@/components/ui/alternative-player';
import CleanYouTubePlayer from '@/components/ui/clean-youtube-player';
import ShareModal from '@/components/ui/share-modal';
import { EyeProtection } from '@/components/ui/eye-protection';
import { useWellBeing } from '@/lib/well-being-context';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

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

interface WatchClientProps {
  initialVideo: VideoDetails | null;
  initialError: string | null;
  initialBlocked: boolean;
  initialBlockReason: string | null;
}

export default function WatchClient({ 
  initialVideo, 
  initialError, 
  initialBlocked, 
  initialBlockReason 
}: WatchClientProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoId = params.id as string;
  const startTime = searchParams.get('t');
  
  const [video, setVideo] = useState<VideoDetails | null>(initialVideo);
  const [loading, setLoading] = useState(!initialVideo && !initialError && !initialBlocked);
  const [error, setError] = useState<string | null>(initialError);
  const [showDescription, setShowDescription] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'comments' | 'related'>('notes');
  
  const videoContainerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const [playerReady, setPlayerReady] = useState(false);
    
    // Helper to safely check if player is interactive
    const isPlayerInteractive = () => {
      return playerRef.current && 
             typeof playerRef.current.getIframe === 'function' && 
             playerRef.current.getIframe() &&
             typeof playerRef.current.loadVideoById === 'function';
    };

    const [currentTime, setCurrentTime] = useState(0);
  const [playerState, setPlayerState] = useState<number>(-1); // -1: unstarted, 0: ended, 1: playing, 2: paused, 3: buffering, 5: cued
  
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteHashtags, setNoteHashtags] = useState<string>('');
  const [noteStartTime, setNoteStartTime] = useState('0:00');
  const [noteEndTime, setNoteEndTime] = useState('0:00');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeNoteRange, setActiveNoteRange] = useState<{start: number; end: number} | null>(null);
  const [noteSearch, setNoteSearch] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureStartTime, setCaptureStartTime] = useState<number | null>(null);
  const [quickNotes, setQuickNotes] = useState<{id: string; startTime: number; endTime: number; createdAt: number}[]>([]);
  
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [backgroundPlayEnabled, setBackgroundPlayEnabled] = useState(false);
  const [loopNoteEnabled, setLoopNoteEnabled] = useState(false);
  const [videoLoopEnabled, setVideoLoopEnabled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
    const [useAlternativePlayer, setUseAlternativePlayer] = useState(false);
    const [isWatchLocked, setIsWatchLocked] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'note' | 'quickNote' } | null>(null);

    const { 
      incrementShortsCount, 
      resetContinuousTime,
      continuousWatchTime,
      limits
    } = useWellBeing();

    const requestRef = useRef<number | null>(null);
  const loopNoteEnabledRef = useRef(loopNoteEnabled);
  const videoLoopEnabledRef = useRef(videoLoopEnabled);
  const activeNoteRangeRef = useRef(activeNoteRange);

  useEffect(() => { loopNoteEnabledRef.current = loopNoteEnabled; }, [loopNoteEnabled]);
  useEffect(() => { videoLoopEnabledRef.current = videoLoopEnabled; }, [videoLoopEnabled]);
  useEffect(() => { activeNoteRangeRef.current = activeNoteRange; }, [activeNoteRange]);

  const [blocked, setBlocked] = useState(initialBlocked);
  const [blockReason, setBlockReason] = useState<string | null>(initialBlockReason);

    const { userId, isLoaded: userLoaded } = useUser();
    const { t, showRamadanCountdown } = useI18n();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscribing, setSubscribing] = useState(false);
    const [daysUntilRamadan, setDaysUntilRamadan] = useState<number | null>(null);

    useEffect(() => {
      const { getDaysUntilRamadan } = require('@/lib/date-utils');
      setDaysUntilRamadan(getDaysUntilRamadan());
    }, []);

    const isRamadanCountdownVisible = showRamadanCountdown && daysUntilRamadan !== null && daysUntilRamadan > 0;
    const mainPaddingTop = isRamadanCountdownVisible ? 'pt-[40px] sm:pt-[36px]' : 'pt-0';
    
    useEffect(() => {
      // Reset player state when video changes
      setPlayerReady(false);
      playerRef.current = null;
    }, [videoId]);

    const { addNote, updateNote, deleteNote, getNotesByVideoId, isLoaded } = useNotes();
    const { toggleWatchLater, isInWatchLater } = useWatchLater();

  const videoNotes = isLoaded ? getNotesByVideoId(videoId) : [];
  
  const filteredNotes = videoNotes.filter(note => 
    noteSearch === '' || note.content.toLowerCase().includes(noteSearch.toLowerCase())
  );

  const activeSubtitleNote = videoNotes.find(note => 
    currentTime >= note.startTime && currentTime <= note.endTime
  );

  useEffect(() => {
    const checkSubscription = async () => {
      if (!userId || !video) return;
      try {
        const response = await fetch(`/api/subscriptions?userId=${userId}`);
        const subs = await response.json();
        const isSub = Array.isArray(subs) && subs.some((s: any) => s.channelId === video.channelId);
        setIsSubscribed(isSub);
      } catch (err) {
        console.error('Error checking subscription:', err);
      }
    };

    if (userId && video) {
      checkSubscription();
    }
  }, [userId, video]);

  useEffect(() => {
    const recordHistory = async () => {
      if (!userId || !video) return;
      try {
        await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            videoId: videoId,
            videoTitle: video.title,
            videoThumbnail: video.thumbnail,
          }),
        });
      } catch (err) {
        console.error('Error recording history:', err);
      }
    };

    if (userId && video) {
      const timer = setTimeout(recordHistory, 5000);
      return () => clearTimeout(timer);
    }
  }, [userId, video, videoId]);

  const toggleSubscription = async () => {
    if (!userId || !video || subscribing) return;
    setSubscribing(true);
    try {
      if (isSubscribed) {
        await fetch('/api/subscriptions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, channelId: video.channelId }),
        });
        setIsSubscribed(false);
      } else {
        await fetch('/api/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            channelId: video.channelId,
            channelTitle: video.channelName,
            channelThumbnail: video.channelAvatar,
          }),
        });
        setIsSubscribed(true);
      }
    } catch (err) {
      console.error('Error toggling subscription:', err);
    } finally {
      setSubscribing(false);
    }
  };

  const handleWatchLater = () => {
    if (!video) return;
    const added = toggleWatchLater({
      videoId: video.id,
      title: video.title,
      thumbnail: video.thumbnail,
      channelName: video.channelName,
      duration: video.duration
    });
    
    if (added) {
      toast.success('تمت الإضافة إلى المشاهدة لاحقاً', {
        icon: <Clock className="w-4 h-4 text-green-500" />,
        duration: 2000,
      });
    } else {
      toast.info('تمت الإزالة من المشاهدة لاحقاً', {
        duration: 2000,
      });
    }
  };

  useEffect(() => {
    if (!video && !error && !blocked) {
      const fetchVideo = async () => {
        if (!videoId) return;
        
        try {
          setLoading(true);
          setError(null);
          const response = await fetch(`/api/videos/${videoId}`);
          
          if (!response.ok) {
            let errorMsg = 'فشل جلب معلومات الفيديو';
            try {
              const errorData = await response.json();
              errorMsg = errorData.error || errorMsg;
              if (response.status === 403 && errorData.blocked) {
                setBlocked(true);
                setBlockReason(errorData.reason || 'المحتوى غير مسموح به');
                setLoading(false);
                return;
              }
            } catch (e) {
              console.error('Error parsing error JSON:', e);
            }
            throw new Error(errorMsg);
          }
          
          let data;
          try {
            data = await response.json();
          } catch (e) {
            console.error('JSON Parse Error:', e);
            throw new Error('تنسيق البيانات غير صحيح. يرجى المحاولة لاحقاً.');
          }
          
          if (!data) {
            throw new Error('لم يتم العثور على بيانات للفيديو');
          }
          
          setVideo(data);
          setBlocked(false);
        } catch (err) {
          console.error('Error fetching video:', err);
          setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.');
        } finally {
          setLoading(false);
        }
      };

      fetchVideo();
    }
  }, [videoId, video, error, blocked]);

  const animate = () => {
    if (isPlayerInteractive()) {
      const time = playerRef.current.getCurrentTime();
      const duration = playerRef.current.getDuration();
      
      if (typeof time === 'number' && !isNaN(time)) {
        setCurrentTime(time);
        
        const activeRange = activeNoteRangeRef.current;
        const videoLoop = videoLoopEnabledRef.current;
        const noteLoop = loopNoteEnabledRef.current;

        if (activeRange) {
          if (time >= activeRange.end - 0.1) {
            if (noteLoop) {
              playerRef.current.seekTo(activeRange.start, true);
              playerRef.current.playVideo();
            } else {
              if (typeof playerRef.current.getPlayerState === 'function' && playerRef.current.getPlayerState() === 1) {
                playerRef.current.pauseVideo();
                playerRef.current.seekTo(activeRange.end, true);
              }
            }
          }
        } else if (videoLoop && duration > 0 && time >= duration - 0.2) {
          playerRef.current.seekTo(0, true);
          playerRef.current.playVideo();
        }
      }
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      // Cleanup player refs on unmount
      playerRef.current = null;
      setPlayerReady(false);
    };
  }, []);

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    setPlayerReady(true);
    
    if (isPlayerInteractive() && typeof playerRef.current.unMute === 'function') {
      playerRef.current.unMute();
    }
    
    if (isPlayerInteractive()) {
      playerRef.current.playVideo();
    }
    
    if (isPlayerInteractive()) {
      setPlayerState(playerRef.current.getPlayerState());
    }

    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(animate);
  };

  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
    setPlayerState(event.data);
    if (event.data === 1) { // Playing
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(animate);
    } else if (event.data === 0) { // Ended
      if (videoLoopEnabledRef.current && isPlayerInteractive() && !activeNoteRangeRef.current) {
        playerRef.current.seekTo(0, true);
        playerRef.current.playVideo();
      }
    }
  };

  const onPlaybackQualityChange: YouTubeProps['onPlaybackQualityChange'] = (event) => {
  };

  const getCurrentPlayerTime = () => {
    let time = currentTime;
    if (isPlayerInteractive()) {
      const playerTime = playerRef.current.getCurrentTime();
      if (typeof playerTime === 'number' && !isNaN(playerTime)) {
        time = playerTime;
        setCurrentTime(time);
      }
    }
    return time;
  };

  const quickCapture = () => {
    const time = getCurrentPlayerTime();
    const newQuickNote = {
      id: `quick-${Date.now()}`,
      startTime: time,
      endTime: time,
      createdAt: Date.now(),
    };
    setQuickNotes(prev => [...prev, newQuickNote]);
  };

  const startCapture = () => {
    const time = getCurrentPlayerTime();
    setCaptureStartTime(time);
    setNoteStartTime(formatTime(time));
    setNoteEndTime(formatTime(time));
    setIsCapturing(true);
  };

  const stopCapture = () => {
    const time = getCurrentPlayerTime();
    const startTimeCapture = captureStartTime ?? 0;
    const newQuickNote = {
      id: `quick-${Date.now()}`,
      startTime: startTimeCapture,
      endTime: time,
      createdAt: Date.now(),
    };
    setQuickNotes(prev => [...prev, newQuickNote]);
    setNoteEndTime(formatTime(time));
    setIsCapturing(false);
    setCaptureStartTime(null);
  };

  const editQuickNote = (quickNote: {id: string; startTime: number; endTime: number}) => {
    setNoteStartTime(formatTime(quickNote.startTime));
    setNoteEndTime(formatTime(quickNote.endTime));
    setNoteContent('');
    setEditingNote(null);
    setShowNoteForm(true);
    setQuickNotes(prev => prev.filter(n => n.id !== quickNote.id));
  };

  const deleteQuickNote = (id: string) => {
    setItemToDelete({ id, type: 'quickNote' });
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'note') {
      deleteNote(itemToDelete.id);
    } else {
      setQuickNotes(prev => prev.filter(n => n.id !== itemToDelete.id));
    }

    if (activeNoteId === itemToDelete.id) {
      setActiveNoteId(null);
      setActiveNoteRange(null);
    }

    setDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const saveQuickNote = (quickNote: {id: string; startTime: number; endTime: number}) => {
    if (!video) return;
    const serial = videoNotes.length + 1;
    const autoContent = `${video.title} - ملاحظة ${serial}`;
    
    addNote({
      videoId,
      videoTitle: video.title,
      content: autoContent,
      startTime: quickNote.startTime,
      endTime: quickNote.endTime,
    });
    
    setQuickNotes(prev => prev.filter(n => n.id !== quickNote.id));
    if (activeNoteId === quickNote.id) {
      setActiveNoteId(null);
      setActiveNoteRange(null);
    }
  };

  const handleAddNote = () => {
    if (!video) return;

    const startSeconds = parseTime(noteStartTime);
    const endSeconds = parseTime(noteEndTime);
    const hashtagsArray = noteHashtags.split(' ').filter(h => h.startsWith('#')).map(h => h.trim());

    let finalContent = noteContent.trim();
    if (!finalContent) {
      const serial = videoNotes.length + 1;
      finalContent = `${video.title} - ملاحظة ${serial}`;
    }

    if (editingNote) {
      updateNote(editingNote, {
        content: finalContent,
        hashtags: hashtagsArray,
        startTime: startSeconds,
        endTime: endSeconds,
      });
      setEditingNote(null);
    } else {
      addNote({
        videoId,
        videoTitle: video.title,
        content: finalContent,
        hashtags: hashtagsArray,
        startTime: startSeconds,
        endTime: endSeconds,
      });
    }

    setNoteContent('');
    setNoteHashtags('');
    setNoteStartTime('0:00');
    setNoteEndTime('0:00');
    setShowNoteForm(false);
    setCaptureStartTime(null);
    setIsCapturing(false);
  };

  const handleEditNote = (note: VideoNote) => {
    setEditingNote(note.id);
    const isAutoTitle = video && note.content.startsWith(video.title) && note.content.includes(' - ملاحظة ');
    setNoteContent(isAutoTitle || note.content === 'بدون محتوى' ? '' : note.content);
    setNoteHashtags(note.hashtags?.join(' ') || '');
    setNoteStartTime(formatTime(note.startTime));
    setNoteEndTime(formatTime(note.endTime));
    setShowNoteForm(true);
  };

  const handleDeleteNote = (noteId: string) => {
    setItemToDelete({ id: noteId, type: 'note' });
    setDeleteModalOpen(true);
  };

    const playNoteSegment = (note: {id: string; startTime: number; endTime: number}) => {
      if (isWatchLocked) return;
      const isCurrentlyActive = activeNoteId === note.id;
      const isAtEnd = currentTime >= note.endTime - 0.2;
  
      if (isCurrentlyActive && isPlayerInteractive()) {
        const state = playerRef.current.getPlayerState();
        if (state === 1 && !isAtEnd) {
          playerRef.current.pauseVideo();
        } else {
          if (isAtEnd) {
            playerRef.current.seekTo(note.startTime, true);
          }
          playerRef.current.playVideo();
        }
        return;
      }
  
      setActiveNoteId(note.id);
      setActiveNoteRange({ start: note.startTime, end: note.endTime });
      if (isPlayerInteractive()) {
        playerRef.current.seekTo(note.startTime, true);
        playerRef.current.playVideo();
      }
    };

  const captureCurrentTime = (type: 'start' | 'end') => {
    const time = formatTime(currentTime);
    if (type === 'start') {
      setNoteStartTime(time);
    } else {
      setNoteEndTime(time);
    }
  };

  const enableBackgroundPlay = () => {
    setBackgroundPlayEnabled(true);
  };

  const disableBackgroundPlay = () => {
    setBackgroundPlayEnabled(false);
  };

    const toggleFullScreen = () => {
      if (isWatchLocked) return;
      if (!videoContainerRef.current) return;

    
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/?search=${encodeURIComponent(query)}`);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key.toLowerCase() === 'l') {
        if (activeNoteId) {
          setLoopNoteEnabled(prev => !prev);
        } else {
          setVideoLoopEnabled(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [activeNoteId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6" dir="rtl">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-full border-2 border-red-500/20 animate-ping"></div>
          <div className="w-12 h-12 rounded-full border-4 border-red-600 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-[#606060] font-medium text-sm">جاري التحميل...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 p-4" dir="rtl">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <AlertCircle size={32} className="text-red-600" />
        </div>
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold text-[#0f0f0f] mb-2">حدث خطأ</h1>
          <p className="text-[#606060]">{error}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[#f2f2f2] text-[#0f0f0f] rounded-full hover:bg-[#e5e5e5] transition-colors"
          >
            إعادة المحاولة
          </button>
          <Link 
            href="/" 
            className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
          >
            <ArrowRight size={20} />
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 p-4" dir="rtl">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
          <X size={40} className="text-red-600" />
        </div>
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-[#0f0f0f] mb-2">المحتوى محظور</h1>
          <p className="text-[#606060]">{blockReason}</p>
        </div>
        <Link 
          href="/" 
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
        >
          <ArrowRight size={20} />
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 p-4" dir="rtl">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
          <AlertCircle size={32} className="text-gray-400" />
        </div>
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold text-[#0f0f0f] mb-2">الفيديو غير موجود</h1>
          <p className="text-[#606060]">لم نتمكن من العثور على الفيديو المطلوب</p>
        </div>
        <Link 
          href="/" 
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
        >
          <ArrowRight size={20} />
          العودة للرئيسية
        </Link>
      </div>
    );
  }

    return (
      <div className="min-h-screen bg-background" dir="rtl">
      <Masthead onMenuClick={() => setSidebarOpen(!sidebarOpen)} onSearch={handleSearch} />
        <SidebarGuide isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} forceOverlay={true} />
        
        <main className="pt-[64px] px-0 lg:px-6 xl:px-24 pb-12">
        <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row gap-0 lg:gap-6">
                <div className="flex-1 max-w-full lg:max-w-[calc(100%-400px)]">
                {!backgroundPlayEnabled ? (
                  <div ref={videoContainerRef} className="sticky top-[72px] z-[50] relative w-full aspect-video bg-black lg:rounded-2xl overflow-hidden mb-4 shadow-2xl group/player">
                      {useAlternativePlayer ? (
                        <AlternativePlayer videoId={videoId} title={video.title} />
                        ) : (
                        <div className="relative w-full h-full">
                          <CleanYouTubePlayer
                            videoId={videoId}
                            startTime={startTime ? parseInt(startTime) : 0}
                            onReady={onPlayerReady}
                            onStateChange={onPlayerStateChange}
                            isLocked={isWatchLocked}
                            onLockToggle={setIsWatchLocked}
                          />
                        </div>

                        )}


                {/* Full Screen Button */}
                {!isWatchLocked && (
                  <button 
                    onClick={toggleFullScreen}
                    className="absolute top-4 right-4 p-2.5 bg-black/40 backdrop-blur-md hover:bg-black/60 text-white rounded-xl opacity-0 group-hover/player:opacity-100 transition-all duration-300 z-20 border border-white/10"
                    title="ملء الشاشة"
                  >
                    <Maximize size={20} />
                  </button>
                )}

                <AnimatePresence>
                  {activeSubtitleNote && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-12 left-0 right-0 px-4 pointer-events-none z-10"
                    >
                      <div className="mx-auto max-w-[90%] bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden">
                        <div className="flex items-start gap-3">
                          <div className="bg-red-600/30 p-2 rounded-xl border border-red-500/40 flex-shrink-0">
                            <Quote size={18} className="text-red-400 fill-red-400/20" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-base sm:text-lg font-semibold leading-relaxed text-center break-words drop-shadow-md">
                              {activeSubtitleNote.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="relative w-full aspect-video bg-gradient-to-br from-indigo-900 via-purple-900 to-red-900 lg:rounded-2xl overflow-hidden mb-4 flex items-center justify-center shadow-2xl">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>
                <div className="text-center text-white z-10 px-6">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <Music size={80} className="mx-auto mb-6 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-2">وضع الاستماع النشط</h2>
                  <p className="text-gray-300 max-w-xs mx-auto text-sm">استمتع بالمحتوى الصوتي مع إمكانية قفل الشاشة لتوفير الطاقة</p>
                  <button
                    onClick={disableBackgroundPlay}
                    className="mt-8 px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-100 transition-all active:scale-95 shadow-lg"
                  >
                    العودة لمشاهدة الفيديو
                  </button>
                </div>
              </div>
            )}

            <div className="px-4 lg:px-0">
              <h1 className="text-xl sm:text-2xl font-black text-[#0f0f0f] mb-3 leading-tight">{video.title}</h1>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
                <div className="flex items-center gap-4">
                  {video.channelAvatar && (
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                      <img
                        src={video.channelAvatar}
                        alt={video.channelName}
                        className="relative w-12 h-12 rounded-full border-2 border-white shadow-sm"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-[#0f0f0f] flex items-center gap-1 text-base">
                      {video.channelName}
                      {video.isVerified && (
                        <Check size={14} className="bg-gray-500 text-white rounded-full p-0.5" />
                      )}
                    </h3>
                    <p className="text-xs text-[#606060] font-medium">{video.channelSubscribers} مشترك</p>
                  </div>
                  <button 
                    onClick={toggleSubscription}
                    disabled={subscribing}
                    className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 active:scale-95 ${
                      isSubscribed 
                        ? 'bg-[#f2f2f2] text-[#0f0f0f] hover:bg-[#e5e5e5] border border-gray-200' 
                        : 'bg-[#0f0f0f] text-white hover:bg-[#272727] shadow-lg shadow-black/10'
                    } disabled:opacity-50`}
                  >
                    {isSubscribed ? 'تم الاشتراك' : 'اشتراك'}
                  </button>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 sm:pb-0">
                  <button 
                    onClick={handleWatchLater}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full transition-all border shadow-sm active:scale-95",
                      isInWatchLater(videoId) 
                        ? "bg-blue-600 text-white border-blue-500 hover:bg-blue-700" 
                        : "bg-[#f2f2f2] text-[#0f0f0f] border-gray-200 hover:bg-[#e5e5e5]"
                    )}
                  >
                    <AnimatePresence mode="wait">
                      {isInWatchLater(videoId) ? (
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
                    <span className="text-xs font-bold whitespace-nowrap">
                      {isInWatchLater(videoId) ? 'في القائمة' : 'المشاهدة لاحقاً'}
                    </span>
                  </button>

                  <button 
                      onClick={() => setShowShareModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#f2f2f2] rounded-full hover:bg-[#e5e5e5] transition-all border border-gray-200 shadow-sm active:scale-95"
                    >
                      <Share2 size={18} />
                      <span className="text-xs font-bold hidden sm:inline">مشاركة</span>
                    </button>

                    <button 
                      onClick={() => setShowDownloadModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#f2f2f2] rounded-full hover:bg-[#e5e5e5] transition-all border border-gray-200 shadow-sm"
                    >
                      <Download size={18} />
                      <span className="text-xs font-bold hidden sm:inline">تنزيل</span>
                    </button>

                    <button 
                      onClick={() => setUseAlternativePlayer(!useAlternativePlayer)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all border border-gray-200 shadow-sm ${
                        useAlternativePlayer ? 'bg-red-600 text-white border-red-500' : 'bg-[#f2f2f2] hover:bg-[#e5e5e5]'
                      }`}
                    >
                      <RefreshCw size={18} className={useAlternativePlayer ? 'animate-spin-slow' : ''} />
                      <span className="text-xs font-bold hidden sm:inline">
                        {useAlternativePlayer ? 'المشغل الافتراضي' : 'المشغل البديل'}
                      </span>
                    </button>


                  {!backgroundPlayEnabled && (
                    <button 
                      onClick={enableBackgroundPlay}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-full hover:shadow-lg hover:shadow-red-500/20 transition-all active:scale-95 border border-red-400"
                    >
                      <Sparkles size={16} className="animate-pulse" />
                      <span className="text-xs font-bold">وضع الصوت</span>
                    </button>
                  )}

                  <button className="p-2.5 bg-[#f2f2f2] rounded-full hover:bg-[#e5e5e5] transition-colors border border-gray-200">
                    <MoreHorizontal size={20} />
                  </button>
                </div>
              </div>

              <div className="bg-[#f8f8f8] border border-gray-200 rounded-2xl p-4 mb-8 shadow-sm group">
                <div className="flex items-center gap-3 text-sm text-[#0f0f0f] font-bold mb-3">
                  <span className="bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">{video.views}</span>
                  <span className="text-gray-400">•</span>
                  <span className="bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">{video.uploadDate}</span>
                </div>
                <div className={`text-sm text-[#0f0f0f] leading-relaxed whitespace-pre-wrap transition-all ${!showDescription && 'line-clamp-3'}`}>
                  {video.description}
                </div>
                {video.description && video.description.length > 150 && (
                  <button 
                    onClick={() => setShowDescription(!showDescription)}
                    className="text-sm font-bold text-red-600 mt-3 flex items-center gap-1 hover:underline"
                  >
                    {showDescription ? (
                      <>إخفاء الوصف <ChevronUp size={16} /></>
                    ) : (
                      <>عرض المزيد <ChevronDown size={16} /></>
                    )}
                  </button>
                )}
              </div>

              {/* Tabs Section Enhancements */}
              <div className="flex border-b-2 border-gray-100 mb-8 overflow-x-auto no-scrollbar gap-2">
                {[
                  { id: 'notes', label: 'الملاحظات الذكية', icon: MessageSquare, count: videoNotes.length },
                  { id: 'comments', label: 'التعليقات', icon: Quote, count: video.comments?.length },
                  { id: 'related', label: 'مقترحات لك', icon: Sparkles }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-5 py-4 text-sm font-bold whitespace-nowrap transition-all relative ${
                      activeTab === tab.id ? 'text-red-600' : 'text-gray-500 hover:text-black'
                    }`}
                  >
                    <tab.icon size={18} className={activeTab === tab.id ? 'text-red-600' : 'text-gray-400'} />
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${
                        activeTab === tab.id ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                    {activeTab === tab.id && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 rounded-t-full" 
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="mb-8">
              {activeTab === 'comments' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {video.comments && video.comments.length > 0 ? (
                    video.comments.map((comment, idx) => (
                      <div key={idx} className="flex gap-4">
                        <img src={comment.authorAvatar} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-[#0f0f0f] truncate">{comment.authorName}</span>
                            <span className="text-xs text-[#606060]">{comment.published}</span>
                          </div>
                          <p className="text-sm text-[#0f0f0f] leading-relaxed break-words">{comment.text}</p>

                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-[#606060]">
                      <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                      <p>لا توجد تعليقات متاحة</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'related' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 animate-in fade-in duration-300">
                  {video.relatedVideos?.map((v) => (
                    <Link key={v.id} href={`/watch/${v.id}`} className="flex gap-3 group">
                      <div className="relative flex-shrink-0 w-40 aspect-video rounded-lg overflow-hidden bg-gray-100">
                        <img src={v.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 text-white text-[10px] font-medium rounded">
                          {v.duration}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-[#0f0f0f] line-clamp-2 mb-1 group-hover:text-red-600 transition-colors">
                          {v.title}
                        </h3>
                        <p className="text-xs text-[#606060] mb-0.5 truncate">{v.channelName}</p>
                        <p className="text-xs text-[#606060] truncate">{v.views}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="lg:hidden animate-in fade-in duration-300">
                    <NotesSection 
                      noteSearch={noteSearch}
                      setNoteSearch={setNoteSearch}
                      loopNoteEnabled={loopNoteEnabled}
                      setLoopNoteEnabled={setLoopNoteEnabled}
                      quickCapture={quickCapture}
                      currentTime={currentTime}
                      isCapturing={isCapturing}
                      startCapture={startCapture}
                      stopCapture={stopCapture}
                      captureStartTime={captureStartTime}
                      quickNotes={quickNotes}
                      activeNoteId={activeNoteId}
                      playNoteSegment={playNoteSegment}
                      saveQuickNote={saveQuickNote}
                      editQuickNote={editQuickNote}
                      deleteQuickNote={deleteQuickNote}
                      showNoteForm={showNoteForm}
                      setShowNoteForm={setShowNoteForm}
                      editingNote={editingNote}
                      setEditingNote={setEditingNote}
                      setIsCapturing={setIsCapturing}
                      setCaptureStartTime={setCaptureStartTime}
                      noteContent={noteContent}
                      setNoteContent={setNoteContent}
                      noteHashtags={noteHashtags}
                      setNoteHashtags={setNoteHashtags}
                      noteStartTime={noteStartTime}
                      setNoteStartTime={setNoteStartTime}
                      noteEndTime={noteEndTime}
                      setNoteEndTime={setNoteEndTime}
                      captureCurrentTime={captureCurrentTime}
                      handleAddNote={handleAddNote}
                      filteredNotes={filteredNotes}
                      handleEditNote={handleEditNote}
                      handleDeleteNote={handleDeleteNote}
                      videoLoopEnabled={videoLoopEnabled}
                      setVideoLoopEnabled={setVideoLoopEnabled}
                      playerState={playerState}
                    />
                </div>
              )}
            </div>
          </div>

          <div className="w-full lg:w-[380px] xl:w-[400px] flex-shrink-0 hidden lg:block">
            <div className="sticky top-[72px] space-y-6">
              <NotesSection 
                noteSearch={noteSearch}
                setNoteSearch={setNoteSearch}
                loopNoteEnabled={loopNoteEnabled}
                setLoopNoteEnabled={setLoopNoteEnabled}
                quickCapture={quickCapture}
                currentTime={currentTime}
                isCapturing={isCapturing}
                startCapture={startCapture}
                stopCapture={stopCapture}
                captureStartTime={captureStartTime}
                quickNotes={quickNotes}
                activeNoteId={activeNoteId}
                playNoteSegment={playNoteSegment}
                saveQuickNote={saveQuickNote}
                editQuickNote={editQuickNote}
                deleteQuickNote={deleteQuickNote}
                showNoteForm={showNoteForm}
                setShowNoteForm={setShowNoteForm}
                editingNote={editingNote}
                setEditingNote={setEditingNote}
                setIsCapturing={setIsCapturing}
                setCaptureStartTime={setCaptureStartTime}
                noteContent={noteContent}
                setNoteContent={setNoteContent}
                noteStartTime={noteStartTime}
                setNoteStartTime={setNoteStartTime}
                noteEndTime={noteEndTime}
                setNoteEndTime={setNoteEndTime}
                captureCurrentTime={captureCurrentTime}
                handleAddNote={handleAddNote}
                filteredNotes={filteredNotes}
                handleEditNote={handleEditNote}
                handleDeleteNote={handleDeleteNote}
                videoLoopEnabled={videoLoopEnabled}
                setVideoLoopEnabled={setVideoLoopEnabled}
                playerState={playerState}
              />

              <div className="border-t pt-6">
                <h3 className="text-base font-bold text-[#0f0f0f] mb-4">فيديوهات مقترحة</h3>
                <div className="space-y-4">
                  {video.relatedVideos?.slice(0, 10).map((v) => (
                    <Link key={v.id} href={`/watch/${v.id}`} className="flex gap-3 group">
                      <div className="relative flex-shrink-0 w-32 aspect-video rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                        <img src={v.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 text-white text-[10px] font-medium rounded">
                          {v.duration}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-bold text-[#0f0f0f] line-clamp-2 mb-1 group-hover:text-red-600 transition-colors">
                          {v.title}
                        </h3>
                        <p className="text-[10px] text-[#606060] mb-0.5 truncate">{v.channelName}</p>
                        <p className="text-[10px] text-[#606060] truncate">{v.views}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showDownloadModal && video && (
        <DownloadModal
          videoId={videoId}
          videoTitle={video.title}
          onClose={() => setShowDownloadModal(false)}
        />
      )}

      {showShareModal && video && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          videoId={videoId}
          videoTitle={video.title}
          thumbnail={video.thumbnail}
        />
      )}

      {backgroundPlayEnabled && video && (
        <BackgroundPlayer
          videoId={videoId}
          videoTitle={video.title}
          thumbnail={video.thumbnail}
          initialTime={currentTime}
          onClose={disableBackgroundPlay}
        />
      )}

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="حذف الملاحظة"
        description="هل أنت متأكد من رغبتك في حذف هذه الملاحظة؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        variant="danger"
      />
      <EyeProtection showModalInitially={true} />
    </div>
  );
}

function NotesSection({
  noteSearch,
  setNoteSearch,
  loopNoteEnabled,
  setLoopNoteEnabled,
  quickCapture,
  currentTime,
  isCapturing,
  startCapture,
  stopCapture,
  captureStartTime,
  quickNotes,
  activeNoteId,
  playNoteSegment,
  saveQuickNote,
  editQuickNote,
  deleteQuickNote,
  showNoteForm,
  setShowNoteForm,
  editingNote,
  setEditingNote,
  setIsCapturing,
  setCaptureStartTime,
    noteContent,
    setNoteContent,
    noteHashtags,
    setNoteHashtags,
    noteStartTime,
  setNoteStartTime,
  noteEndTime,
  setNoteEndTime,
  captureCurrentTime,
  handleAddNote,
  filteredNotes,
  handleEditNote,
  handleDeleteNote,
  videoLoopEnabled,
  setVideoLoopEnabled,
  playerState
}: any) {

  return (
    <div className="bg-white lg:border lg:border-gray-200 lg:rounded-3xl p-4 sm:p-6 lg:shadow-xl lg:shadow-black/5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-[#0f0f0f] flex items-center gap-2">
            ملاحظاتك الذكية
            <span className="bg-red-600 w-2 h-2 rounded-full animate-pulse"></span>
          </h2>
          <p className="text-xs text-gray-400 font-medium">نظّم أفكارك وراجع مقاطعك المفضلة</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVideoLoopEnabled(!videoLoopEnabled)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              videoLoopEnabled 
                ? 'bg-red-50 text-red-600 border-2 border-red-200 shadow-sm shadow-red-100' 
                : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
            }`}
            title={videoLoopEnabled ? 'إيقاف تكرار الفيديو' : 'تكرار الفيديو بالكامل'}
          >
            <Repeat size={14} className={videoLoopEnabled ? 'animate-spin' : ''} />
            تكرار الفيديو
          </button>
          <button
            onClick={() => setLoopNoteEnabled(!loopNoteEnabled)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              loopNoteEnabled 
                ? 'bg-blue-50 text-blue-600 border-2 border-blue-200 shadow-sm shadow-blue-100' 
                : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
            }`}
            title={loopNoteEnabled ? 'إيقاف تكرار الملاحظة' : 'تفعيل تكرار الملاحظة'}
          >
            <Repeat size={14} className={loopNoteEnabled ? 'animate-spin' : ''} />
            تكرار المقطع
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#0f0f0f] to-[#272727] rounded-2xl p-4 mb-6 text-white shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/20 blur-3xl -mr-16 -mt-16 group-hover:bg-red-600/30 transition-colors"></div>
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-md border border-white/10">
              <Clock size={16} className="text-red-400" />
            </div>
            <span className="text-sm font-bold text-gray-300">اللحظة الحالية</span>
          </div>
          <span className="text-2xl font-black text-white font-mono tracking-tighter drop-shadow-sm">{formatTime(currentTime)}</span>
        </div>
        
        <div className="relative z-10 flex items-center gap-3">
          {!isCapturing ? (
            <button
              onClick={startCapture}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl text-sm font-black hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-900/40 border border-red-500"
            >
              <Plus size={18} />
              بدء تسجيل مقطع
            </button>
          ) : (
            <button
              onClick={stopCapture}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-black rounded-xl text-sm font-black hover:bg-gray-100 transition-all active:scale-95 shadow-lg animate-pulse"
            >
              <Square size={16} className="fill-current" />
              إيقاف التسجيل ({formatTime(captureStartTime ?? 0)})
            </button>
          )}
          <button
            onClick={quickCapture}
            className="w-12 h-12 flex items-center justify-center bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all active:scale-95 border border-white/10 backdrop-blur-md"
            title="التقاط سريع"
          >
            <Sparkles size={20} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {quickNotes.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              مسودات سريعة ({quickNotes.length})
            </h3>
            <div className="space-y-2 max-h-[160px] overflow-y-auto no-scrollbar">
              {quickNotes.map((qn: any) => (
                <motion.div 
                  layout
                  key={qn.id} 
                  className={`flex items-center justify-between bg-amber-50/50 border rounded-xl p-3 transition-all ${
                    activeNoteId === qn.id ? 'border-amber-400 bg-amber-100 shadow-sm' : 'border-amber-100 hover:border-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                    <span className="text-sm font-mono font-bold text-amber-800">
                      {formatTime(qn.startTime)} {qn.endTime !== qn.startTime && `- ${formatTime(qn.endTime)}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => playNoteSegment(qn)}
                      className={`p-2 rounded-full transition-colors ${
                        activeNoteId === qn.id 
                          ? 'bg-amber-600 text-white' 
                          : 'text-amber-600 hover:bg-amber-100'
                      }`}
                    >
                      {activeNoteId === qn.id && playerState === 1 ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <button
                      onClick={() => saveQuickNote(qn)}
                      className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => deleteQuickNote(qn.id)}
                      className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="ابحث في ملاحظاتك..."
          value={noteSearch}
          onChange={(e) => setNoteSearch(e.target.value)}
          className="w-full pr-11 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
          dir="rtl"
        />
      </div>

      <AnimatePresence>
        {showNoteForm && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="bg-white rounded-2xl p-5 mb-6 border border-red-100 shadow-xl shadow-red-500/5 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-[#0f0f0f] text-base">
                {editingNote ? 'تعديل الملاحظة' : 'إضافة ملاحظة جديدة'}
              </h3>
              <button 
                onClick={() => {
                  setShowNoteForm(false);
                  setEditingNote(null);
                  setIsCapturing(false);
                  setCaptureStartTime(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="عن ماذا يتحدث هذا المقطع؟"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl resize-none h-32 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all mb-4"
                dir="rtl"
              />

              <div className="mb-4">
                <input
                  type="text"
                  value={noteHashtags}
                  onChange={(e) => setNoteHashtags(e.target.value)}
                  placeholder="أضف وسوم (مثال: #تعليم #برمجة)"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  dir="rtl"
                />
              </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2 block">بداية المقطع</label>
                <div className="relative">
                  <input
                    type="text"
                    value={noteStartTime}
                    onChange={(e) => setNoteStartTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                    placeholder="0:00"
                  />
                  <button
                    onClick={() => captureCurrentTime('start')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white text-red-600 rounded-lg shadow-sm border border-gray-100 hover:bg-red-50 transition-colors"
                  >
                    <Clock size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2 block">نهاية المقطع</label>
                <div className="relative">
                  <input
                    type="text"
                    value={noteEndTime}
                    onChange={(e) => setNoteEndTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                    placeholder="0:00"
                  />
                  <button
                    onClick={() => captureCurrentTime('end')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white text-red-600 rounded-lg shadow-sm border border-gray-100 hover:bg-red-50 transition-colors"
                  >
                    <Clock size={14} />
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleAddNote}
              className="w-full py-3.5 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
            >
              <Check size={20} />
              {editingNote ? 'حفظ التغييرات' : 'تأكيد الحفظ'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4 max-h-[50vh] lg:max-h-[60vh] overflow-y-auto no-scrollbar pb-6">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <MessageSquare size={24} className="text-gray-300" />
            </div>
            <p className="text-sm font-bold text-gray-400">
              {noteSearch ? 'لم نعثر على نتائج مطابقة' : 'لا توجد ملاحظات مسجلة لهذا الفيديو'}
            </p>
          </div>
        ) : (
          filteredNotes.map((note: any, index: number) => {
            const isActive = activeNoteId === note.id;
            const duration = note.endTime - note.startTime;
            const progress = isActive && duration > 0 
              ? Math.min(100, Math.max(0, ((currentTime - note.startTime) / duration) * 100))
              : 0;

            return (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                key={note.id}
                className={`group relative bg-white rounded-2xl p-4 border-2 transition-all duration-500 ${
                  isActive 
                    ? 'border-red-500 shadow-2xl shadow-red-500/10 z-10' 
                    : 'border-gray-100 hover:border-gray-200 hover:shadow-lg hover:shadow-black/5'
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-100 rounded-t-2xl overflow-hidden">
                    <motion.div 
                      className="h-full bg-red-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.1, ease: "linear" }}
                    />
                  </div>
                )}

                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black tracking-tighter uppercase transition-all ${
                        isActive ? 'bg-red-600 text-white shadow-lg shadow-red-500/30' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <Clock size={10} />
                        <span>{formatTime(note.startTime)}</span>
                        <span className="opacity-50">-</span>
                        <span>{formatTime(note.endTime)}</span>
                      </div>
                      {isActive && (
                        <span className="flex items-center gap-1 text-[10px] font-black text-red-600 animate-pulse">
                          <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                          قيد العرض
                        </span>
                      )}
                    </div>
                    
                      <p className={`text-sm leading-relaxed mb-4 whitespace-pre-wrap transition-all ${
                        isActive ? 'text-black font-bold' : 'text-gray-600 font-medium'
                      }`}>
                        {note.content}
                      </p>

                      {note.hashtags && note.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {note.hashtags.map((tag: string, i: number) => (
                            <span key={i} className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                        <button
                          onClick={() => handleEditNote(note)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="تعديل"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="حذف"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="flex flex-col mt-4 pt-3 border-t border-gray-50">
                        <span className="text-[10px] font-bold text-gray-400">
                          تمت الإضافة في {formatDate(note.createdAt)}
                        </span>
                        {note.updatedAt && note.updatedAt !== note.createdAt && (
                          <span className="text-[9px] font-medium text-gray-400/80">
                            آخر تعديل في {formatDate(note.updatedAt)}
                          </span>
                        )}
                      </div>
                    </div>

  
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => playNoteSegment(note)}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-90 ${
                        isActive 
                          ? 'bg-red-600 text-white shadow-red-500/40 hover:bg-red-700' 
                          : 'bg-white text-green-600 hover:bg-green-50 border-2 border-green-100 shadow-green-500/5'
                      }`}
                    >
                      {isActive && playerState === 1 ? (
                        <Pause size={24} className="fill-current" />
                      ) : (
                        <Play size={24} className="ml-1 fill-current" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
