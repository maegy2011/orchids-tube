"use client";

import React, { useRef, useState, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  MoreVertical, 
  StickyNote, 
  Shield, 
  Home, 
  ArrowLeft,
  ArrowRight, 
  Loader2, 
  X, 
  Trash2, 
  Clock 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ConfirmModal from '@/components/ui/confirm-modal';
import { ThemeToggle } from '@/components/theme-toggle';
import { useI18n } from '@/lib/i18n-context';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { getFormattedGregorianDate, getFormattedHijriDate, getDaysUntilRamadan } from '@/lib/date-utils';

interface MastheadProps {
  onSearch?: (query: string) => void;
  onMenuClick?: () => void;
  externalLoading?: boolean;
}

const Masthead = ({ onSearch, onMenuClick, externalLoading }: MastheadProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { t, direction, language, showGregorianDate, showHijriDate, hijriOffset, showRamadanCountdown } = useI18n();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [daysUntilRamadan, setDaysUntilRamadan] = useState<number | null>(null);

  useEffect(() => {
    setDaysUntilRamadan(getDaysUntilRamadan());
  }, []);

  const isRamadanCountdownVisible = showRamadanCountdown && daysUntilRamadan !== null && daysUntilRamadan > 0;
  const headerTop = isRamadanCountdownVisible ? 'top-[40px] sm:top-[36px]' : 'top-0';

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLoading = isSearching || externalLoading;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length > 0) {
        try {
          const response = await fetch(`/api/youtube/autocomplete?q=${encodeURIComponent(searchQuery)}`);
          if (response.ok) {
            const data = await response.json();
            setSuggestions(data);
            setShowSuggestions(true);
            setSelectedIndex(-1);
          }
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const isRTL = (text: string) => {
    if (!text) return true;
    const rtlRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\FB50-\uFDFF\uFE70-\uFEFF]/;
    return rtlRegex.test(text);
  };

  const handleSearch = async (e?: React.FormEvent, query?: string) => {
    if (e) e.preventDefault();
    const finalQuery = query || searchQuery;
    if (finalQuery.trim()) {
      setIsSearching(true);
      setShowSuggestions(false);
      if (onSearch) {
        await onSearch(finalQuery.trim());
      } else {
        router.push(`/?search=${encodeURIComponent(finalQuery.trim())}`);
      }
      setTimeout(() => setIsSearching(false), 800);
    }
    setShowMobileSearch(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    handleSearch(undefined, suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const inputDirection = isRTL(searchQuery) ? 'rtl' : 'ltr';
  const searchParams = useSearchParams();
  const searchQueryParam = searchParams.get('search');
  const isHome = pathname === '/' && !searchQueryParam;

  const handleBack = () => {
    if (searchQueryParam) {
      router.push('/');
      return;
    }
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleClearCache = async () => {
    try {
      // Clear localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();

      // Clear IndexedDB
      if (typeof window !== 'undefined' && window.indexedDB) {
        const databases = await window.indexedDB.databases();
        databases.forEach(db => {
          if (db.name) window.indexedDB.deleteDatabase(db.name);
        });
      }

      // Clear CacheStorage (Service Worker caches)
      if (typeof window !== 'undefined' && window.caches) {
        const cacheNames = await window.caches.keys();
        await Promise.all(cacheNames.map(name => window.caches.delete(name)));
      }

      // Clear all cookies
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      }

      toast.success(t('savedSuccessfully'));
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error) {
      console.error("Failed to clear cache:", error);
      toast.error("Failed to clear some cache data");
      // Still reload and go home to be safe
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    }
  };

  const handleClearState = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("searchQuery");
      localStorage.removeItem("currentPage");
      localStorage.removeItem("scrollPosition");
    }
  };

  return (
    <>
      <AnimatePresence>
        {showMobileSearch && (
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed ${headerTop} left-0 right-0 z-[2050] flex flex-col bg-background select-none h-screen overflow-hidden transition-all duration-300`}
          >
            <div className="flex items-center h-[56px] px-2 border-b border-border">
              <button
                onClick={() => setShowMobileSearch(false)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <ArrowRight size={24} className="text-foreground rtl:rotate-180" />
              </button>
              <form onSubmit={handleSearch} className="flex-1 flex items-center bg-muted rounded-full px-4 mx-2">
                <input
                  type="text"
                  placeholder={`${t('search')}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`flex-1 py-2 bg-transparent border-none outline-none text-[16px] text-foreground ${isRTL(searchQuery) ? 'text-right' : 'text-left'}`}
                  autoFocus
                  dir={inputDirection}
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="p-1">
                    <X size={18} className="text-muted-foreground" />
                  </button>
                )}
              </form>
              <button type="submit" onClick={handleSearch} className="p-2" disabled={isLoading}>
                {isLoading ? <Loader2 size={24} className="text-red-600 animate-spin" /> : <Search size={24} className="text-foreground" />}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-background pt-2">
              {suggestions.length > 0 && suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full px-4 py-3 hover:bg-muted flex items-center gap-4 text-[16px] text-foreground active:bg-muted/80 ${isRTL(suggestion) ? 'flex-row' : 'flex-row-reverse'}`}
                  dir={isRTL(suggestion) ? 'rtl' : 'ltr'}
                >
                  <Search size={20} className="text-muted-foreground shrink-0" />
                  <span className="flex-1 text-start truncate font-medium">{suggestion}</span>
                </button>
              ))}
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <header className={`fixed ${headerTop} left-0 right-0 z-[5000] flex items-center justify-between h-[64px] px-4 bg-background/80 backdrop-blur-md border-b border-border select-none transition-all duration-300`}>
        <div className="flex items-center gap-2">
          {!isHome && (
            <button
              className="p-2 rounded-full hover:bg-muted transition-colors active:scale-95"
              onClick={handleBack}
              aria-label={t('back')}
            >
              <ArrowLeft size={24} className="text-foreground rtl:rotate-180" />
            </button>
          )}
          <button
            className="p-2 rounded-full hover:bg-muted transition-colors active:scale-95"
            onClick={onMenuClick}
            aria-label="القائمة"
          >
            <Menu size={24} className="text-foreground" />
          </button>

          <Link href="/" onClick={handleClearState} className="flex items-center group px-1">
            <motion.div
              className="relative flex items-center"
              animate={theme === 'boys' || theme === 'girls' ? {
                scale: [1, 1.05, 1],
                rotate: [0, 2, -2, 0],
              } : {}}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="absolute -inset-2 bg-red-50 dark:bg-red-900/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <motion.svg
                width="32" height="22" viewBox="0 0 28 20" className="relative"
                animate={theme === 'boys' ? {
                  y: [0, -2, 0],
                } : theme === 'girls' ? {
                  scale: [1, 1.1, 1],
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <path
                  d="M27.9727 3.12324C27.6435 1.89323 26.6768 0.926623 25.4468 0.597366C23.2197 0 14.285 0 14.285 0C14.285 0 5.35042 0 3.12324 0.597366C1.89323 0.926623 0.926623 1.89323 0.597366 3.12324C0 5.35042 0 10 0 10C0 10 0 14.6496 0.597366 16.8768C0.926623 18.1068 1.89323 19.0734 3.12324 19.4026C5.35042 20 14.285 20 14.285 20C14.285 20 23.2197 20 25.4468 19.4026C26.6768 19.0734 27.6435 18.1068 27.9727 16.8768C28.5701 14.6496 28.5701 10 28.5701 10C28.5701 10 28.5701 5.35042 27.9727 3.12324Z"
                  fill={theme === 'boys' ? '#0ea5e9' : theme === 'girls' ? '#f472b6' : '#FF0000'}
                />
                <path d="M11.4253 14.2854L18.8477 10.0004L11.4253 5.71533V14.2854Z" fill="white" />
              </motion.svg>
              <span className={cn(
                "text-[20px] font-bold tracking-tight ms-1.5 hidden sm:inline-block transition-colors duration-500",
                theme === 'boys' ? 'text-sky-600' : theme === 'girls' ? 'text-pink-600' : 'text-foreground'
              )}>
                Orchids
              </span>
            </motion.div>
          </Link>

          <div className="hidden lg:flex flex-col items-start ms-4 text-[11px] font-bold text-muted-foreground/80 leading-tight border-s border-border ps-4">
            {showGregorianDate && (
              <div className="whitespace-nowrap uppercase tracking-tighter">
                {getFormattedGregorianDate(language)}
              </div>
            )}
            {showHijriDate && (
              <div className="whitespace-nowrap uppercase tracking-tighter text-primary/80">
                {getFormattedHijriDate(language, hijriOffset)}
              </div>
            )}
          </div>
        </div>

        <div className="hidden md:flex flex-1 justify-center max-w-[720px] px-2 lg:px-8 relative" ref={suggestionsRef}>
          <div className="flex w-full items-center gap-4">
            <form onSubmit={handleSearch} className="flex flex-1 items-center bg-muted border border-border rounded-full px-4 focus-within:border-blue-500 focus-within:bg-background transition-all group shadow-sm hover:shadow-md">
              <div className="flex-1 flex items-center h-[40px]">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={`${t('search')}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onKeyDown={handleKeyDown}
                  className={`w-full bg-transparent border-none outline-none text-[16px] font-medium placeholder-muted-foreground text-foreground ${isRTL(searchQuery) ? 'text-right' : 'text-left'}`}
                  dir={inputDirection}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      inputRef.current?.focus();
                    }}
                    className="p-1 hover:bg-muted/50 rounded-full transition-colors"
                  >
                    <X size={16} className="text-muted-foreground" />
                  </button>
                )}
              </div>
              <div className="h-6 w-[1px] bg-border mx-2" />
              <button
                type="submit"
                disabled={isLoading}
                className="p-2 hover:bg-muted/50 rounded-full transition-colors disabled:opacity-50 active:scale-95"
                aria-label="بحث"
              >
                {isLoading ? <Loader2 size={20} className="text-red-600 animate-spin" /> : <Search size={20} className="text-foreground" />}
              </button>
            </form>
          </div>

          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-[48px] right-8 left-8 bg-card border border-border rounded-2xl shadow-xl py-2 z-[2100] overflow-hidden"
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full px-5 py-2.5 hover:bg-muted flex items-center gap-3 text-[15px] font-medium text-foreground transition-colors ${selectedIndex === index ? 'bg-muted' : ''} ${isRTL(suggestion) ? 'flex-row' : 'flex-row-reverse'}`}
                    dir={isRTL(suggestion) ? 'rtl' : 'ltr'}
                  >
                    <Search size={18} className="text-muted-foreground shrink-0" />
                    <span className="flex-1 text-start truncate">{suggestion}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            onClick={() => setShowMobileSearch(true)}
            className="md:hidden p-2.5 rounded-full hover:bg-muted transition-colors active:scale-95"
            aria-label="بحث"
          >
            <Search size={24} className="text-foreground" />
          </button>

          <Link
            href="/"
            className={`p-2.5 rounded-full hover:bg-muted transition-all active:scale-95 ${isHome ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'text-foreground'}`}
            title={t('home')}
          >
            <Home size={24} />
          </Link>

          <div className="hidden xl:flex items-center gap-1 sm:gap-2">
            <Link
              href="/watch-later"
              className={`p-2.5 rounded-full hover:bg-muted transition-all active:scale-95 ${pathname === '/watch-later' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-foreground'}`}
              title={t('watchLater')}
            >
              <Clock size={24} />
            </Link>

            <Link
              href="/notes"
              className={`p-2.5 rounded-full hover:bg-muted transition-all active:scale-95 ${pathname === '/notes' ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'text-foreground'}`}
              title={t('notes')}
            >
              <StickyNote size={24} />
            </Link>

            <Link
              href="/admin/filter"
              className={`p-2.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all active:scale-95 ${pathname?.startsWith('/admin') ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-foreground'}`}
              title={t('filterManagement')}
            >
              <Shield size={24} />
            </Link>
          </div>

          <ThemeToggle variant="cycle" />

          <div className="xl:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2.5 rounded-full hover:bg-muted transition-colors active:scale-95 text-foreground">
                  <MoreVertical size={24} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/watch-later" className="flex items-center gap-3 w-full">
                    <Clock size={18} />
                    <span>{t('watchLater')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/notes" className="flex items-center gap-3 w-full">
                    <StickyNote size={18} />
                    <span>{t('notes')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/filter" className="flex items-center gap-3 w-full">
                    <Shield size={18} />
                    <span>{t('filterManagement')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowClearCacheModal(true)}
                  className="flex items-center gap-3 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10"
                >
                  <Trash2 size={18} />
                  <span>{t('clearCache')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="hidden xl:block">
            <button
              onClick={() => setShowClearCacheModal(true)}
              className="flex items-center p-2.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-foreground hover:text-red-600 transition-all active:scale-95 ml-1 group"
              title={t('clearCache')}
            >
              <Trash2 size={24} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        <ConfirmModal
          isOpen={showClearCacheModal}
          onClose={() => setShowClearCacheModal(false)}
          onConfirm={handleClearCache}
          title={t('clearCache')}
          description={t('clearCacheConfirm')}
          confirmText={t('clearAll')}
          cancelText={t('back')}
          variant="danger"
        />
      </header>
    </>
  );
};

export default Masthead;
