"use client";

import React from 'react';
import { 
  Home, 
  PlaySquare, 
  StickyNote, 
  X, 
  Heart, 
  History, 
  Flame, 
  Settings, 
  HelpCircle, 
  MessageSquarePlus, 
  CheckCircle2, 
  Headphones, 
  User, 
  ChevronLeft, 
  Clock,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useI18n } from '@/lib/i18n-context';

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  href,
  isActive = false,
  onClick,
  suffix
}: { 
  icon: React.ElementType, 
  label: string, 
  href?: string,
  isActive?: boolean,
  onClick?: () => void,
  suffix?: React.ReactNode
}) => {
  const { direction } = useI18n();
  const { theme } = useTheme();

  const getActiveStyles = () => {
    if (theme === 'boys') return 'bg-sky-50 dark:bg-sky-900/20 text-sky-600';
    if (theme === 'girls') return 'bg-pink-50 dark:bg-pink-900/20 text-pink-600';
    return 'bg-red-50 dark:bg-red-900/20 text-red-600';
  };

  const getIconStyles = () => {
    if (theme === 'boys') return isActive ? 'text-sky-600 fill-sky-600/10' : 'text-foreground';
    if (theme === 'girls') return isActive ? 'text-pink-600 fill-pink-600/10' : 'text-foreground';
    return isActive ? 'text-red-600 fill-red-600/10' : 'text-foreground';
  };

  const getIndicatorColor = () => {
    if (theme === 'boys') return 'bg-sky-600';
    if (theme === 'girls') return 'bg-pink-600';
    return 'bg-red-600';
  };

  const content = (
    <div
      onClick={onClick}
      className={`
        flex items-center h-[40px] px-3 mx-3 cursor-pointer transition-all duration-200
        rounded-xl group relative w-full
        ${isActive ? getActiveStyles() : 'bg-transparent hover:bg-muted text-foreground'}
      `}
    >
      <div className="flex items-center justify-center w-6 h-6 me-4">
        <Icon 
          className={`w-6 h-6 transition-transform duration-200 group-hover:scale-110 ${getIconStyles()}`} 
          strokeWidth={isActive ? 2.5 : 2}
        />
      </div>
      <div className="flex-1 flex items-center justify-between overflow-hidden">
        <span 
          className={`
            whitespace-nowrap overflow-hidden text-ellipsis text-start
            ${isActive ? 'font-semibold' : 'font-medium'}
            text-[14px] leading-tight
          `}
        >
          {label}
        </span>
        {suffix && (
          <div className="ms-2 text-muted-foreground group-hover:text-foreground transition-colors">
            {suffix}
          </div>
        )}
      </div>
      {isActive && (
        <motion.div 
          layoutId="activeSide"
          className={`absolute ${direction === 'rtl' ? 'right-0' : 'left-0'} w-1 h-6 ${getIndicatorColor()} rounded-full`}
        />
      )}
    </div>
  );

  if (href && href !== '#') {
    return (
      <Link href={href} className="w-full">
        {content}
      </Link>
    );
  }

  return content;
};

interface SidebarGuideProps {
  isOpen?: boolean;
  onClose?: () => void;
  forceOverlay?: boolean;
}

  const SidebarGuide = ({ isOpen = false, onClose, forceOverlay = false }: SidebarGuideProps) => {
    const pathname = usePathname();
    const { t, direction } = useI18n();

    return (
      <>
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
                className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[4990] ${forceOverlay ? '' : 'lg:hidden'}`}
              onClick={onClose}
            />
          )}
        </AnimatePresence>

        <aside 
          className={`
            w-[240px] h-screen bg-background flex flex-col fixed top-0 pt-[64px] z-[5010] overflow-y-auto no-scrollbar
            transition-all duration-300 ease-in-out border-border
            ${direction === 'rtl' ? 'right-0 border-l' : 'left-0 border-r'}
            ${isOpen ? 'translate-x-0 shadow-2xl' : (direction === 'rtl' ? 'translate-x-full' : '-translate-x-full')}
            ${forceOverlay ? '' : 'lg:translate-x-0'}
          `}
          aria-label={t('settings')}
        >
          <div className="flex flex-col gap-1 py-3">
              <SidebarItem 
                icon={Home} 
                label={t('home')} 
                href="/"
                isActive={pathname === '/'} 
                onClick={onClose}
              />
              <SidebarItem 
                icon={Zap} 
                label="Shorts" 
                href="/shorts"
                isActive={pathname === '/shorts'} 
                onClick={onClose}
                suffix={<span className="text-[10px] bg-red-600 text-white px-1 rounded animate-pulse">HOT</span>}
              />
              <SidebarItem 
                icon={Flame} 
                label={t('trending')}
              href="/"
              onClick={onClose}
            />
            <SidebarItem 
              icon={PlaySquare} 
              label={t('subscriptions')}
              href="/subscriptions"
              isActive={pathname === '/subscriptions'}
              onClick={onClose}
            />
          </div>

          <div className="h-[1px] bg-border my-2 mx-4" />

            <div className="flex flex-col gap-1 py-1">
              <SidebarItem 
                icon={User} 
                label={t('library')}
                href="/history"
                isActive={pathname === '/history'}
                onClick={onClose}
                suffix={<span className="text-[14px]">{direction === 'rtl' ? '←' : '→'}</span>}
              />
              <SidebarItem 
                icon={History} 
                label={t('history')}
                href="/history"
                isActive={pathname === '/history'}
                onClick={onClose}
              />
                <SidebarItem 
                  icon={Heart} 
                  label={t('favorites')}
                  href="/favorites"
                  isActive={pathname === '/favorites'}
                  onClick={onClose}
                />
                    <SidebarItem 
                      icon={Clock} 
                      label={t('watchLater')}
                    href="/watch-later"
                    isActive={pathname === '/watch-later'}
                    onClick={onClose}
                  />
                <SidebarItem 
                  icon={StickyNote} 
                  label={t('notes')}
                  href="/notes"
                  isActive={pathname === '/notes'}
                  onClick={onClose}
                />

            </div>

            <div className="h-[1px] bg-border my-2 mx-4" />

                  <div className="flex flex-col gap-1 py-1 pb-20">
                    <SidebarItem 
                      icon={HelpCircle} 
                      label={t('help')} 
                      href="/help"
                      isActive={pathname === '/help'}
                      onClick={onClose}
                    />
                    <SidebarItem 
                      icon={MessageSquarePlus} 
                      label={t('feedback')} 
                      href="/feedback"
                      isActive={pathname === '/feedback'}
                      onClick={onClose}
                    />
                    <SidebarItem 
                      icon={Headphones} 
                      label={t('support')} 
                      href="/support"
                      isActive={pathname === '/support'}
                      onClick={onClose}
                    />
                    <SidebarItem 
                      icon={Settings} 
                      label={t('settings')} 
                      href="/settings"
                      isActive={pathname === '/settings'}
                      onClick={onClose}
                    />
                  </div>

        </aside>
      </>
    );
  };


export default SidebarGuide;
