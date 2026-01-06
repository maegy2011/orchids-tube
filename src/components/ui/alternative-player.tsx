"use client";

import React, { useEffect, useRef } from 'react';

interface AlternativePlayerProps {
  videoId: string;
  title?: string;
}

export default function AlternativePlayer({ videoId, title }: AlternativePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Import the custom element on the client side
    import('youtube-video-element').then(() => {
      console.log('youtube-video-element loaded');
    }).catch(err => {
      console.error('Failed to load youtube-video-element:', err);
    });
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full bg-black">
      {/* @ts-ignore - custom element */}
      <youtube-video
        src={`https://www.youtube.com/watch?v=${videoId}`}
        controls
        style={{ width: '100%', height: '100%', display: 'block' }}
        title={title}
      />
    </div>
  );
}
