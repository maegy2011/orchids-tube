/* eslint-disable @typescript-eslint/no-explicit-any */
export interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  setVolume(volume: number): void;
  getVolume(): number;
  getCurrentTime(): number;
  getDuration(): number;
  getVideoUrl(): string;
  getVideoEmbedCode(): string;
  getPlaybackRate(): number;
  setPlaybackRate(suggestedRate: number): void;
  getAvailablePlaybackRates(): number[];
  getPlayerState(): number;
  destroy(): void;
}

export interface YTPlayerOptions {
  height?: string | number;
  width?: string | number;
  videoId?: string;
  host?: string;
  playerVars?: {
    autoplay?: 0 | 1;
    cc_load_policy?: 1;
    color?: 'red' | 'white';
    controls?: 0 | 1;
    disablekb?: 0 | 1;
    enablejsapi?: 0 | 1;
    end?: number;
    fs?: 0 | 1;
    hl?: string;
    iv_load_policy?: 1 | 3;
    list?: string;
    listType?: 'playlist' | 'search' | 'user_uploads';
    loop?: 0 | 1;
    modestbranding?: 1;
    origin?: string;
    playlist?: string;
    playsinline?: 0 | 1;
    rel?: 0 | 1;
    showinfo?: 0 | 1;
    start?: number;
    widget_referrer?: string;
  };
  events?: {
    onReady?: (event: { target: YTPlayer }) => void;
    onStateChange?: (event: { target: YTPlayer; data: number }) => void;
    onPlaybackQualityChange?: (event: { target: YTPlayer; data: string }) => void;
    onPlaybackRateChange?: (event: { target: YTPlayer; data: number }) => void;
    onError?: (event: { target: YTPlayer; data: number }) => void;
    onApiChange?: (event: { target: YTPlayer }) => void;
  };
}

export interface YTConstructor {
  Player: new (element: HTMLElement | string, options: YTPlayerOptions) => YTPlayer;
  PlayerState: {
    UNSTARTED: -1;
    ENDED: 0;
    PLAYING: 1;
    PAUSED: 2;
    BUFFERING: 3;
    CUED: 5;
  };
}

declare global {
  interface Window {
    YT: YTConstructor;
    onYouTubeIframeAPIReady: () => void;
  }
  
  const YT: YTConstructor;
}