"use client";

import dynamic from 'next/dynamic';
import { VideoDetails } from '@/lib/types';

const WatchClient = dynamic(() => import('./WatchClient'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6" dir="rtl">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-24 h-24 rounded-full border-2 border-red-500/20 animate-ping"></div>
        <div className="w-12 h-12 rounded-full border-4 border-red-600 border-t-transparent animate-spin"></div>
      </div>
      <p className="text-[#606060] font-medium text-sm">جاري التحميل...</p>
    </div>
  )
});

interface WatchDynamicProps {
  initialVideo: VideoDetails | null;
  initialError: string | null;
  initialBlocked: boolean;
  initialBlockReason: string | null;
}

export default function WatchDynamic(props: WatchDynamicProps) {
  return <WatchClient {...props} />;
}
