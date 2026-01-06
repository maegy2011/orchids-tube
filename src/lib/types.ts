export interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
  uploadedAt: string;
  channelName: string;
  channelAvatar: string;
  channelId: string;
  isVerified: boolean;
  url: string;
}

export interface VideoDetails {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  views: string;
  likes: string;
  uploadDate: string;
  channelName: string;
  channelAvatar: string;
  channelId: string;
  channelSubscribers: string;
  isVerified: boolean;
  keywords: string[];
  category: string;
  embedUrl: string;
  relatedVideos?: any[];
  comments?: any[];
}

export interface VideoNote {
  id: string;
  videoId: string;
  videoTitle: string;
  content: string;
  hashtags?: string[];
  startTime: number;
  endTime: number;
  createdAt: string;
  updatedAt: string;
}

export interface NotesStore {
  notes: VideoNote[];
  addNote: (note: Omit<VideoNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, updates: Partial<VideoNote>) => void;
  deleteNote: (id: string) => void;
  getNotesByVideoId: (videoId: string) => VideoNote[];
}

export type ContentType = 'video' | 'playlist' | 'channel';

export type AllowedCategory = 
  | 'education'
  | 'quran'
  | 'programming'
  | 'science'
  | 'documentary'
  | 'kids'
  | 'language'
  | 'history'
  | 'health'
  | 'mathematics'
  | 'business'
  | 'cooking'
  | 'crafts'
  | 'nature';

export interface WhitelistItem {
  id: string;
  type: ContentType;
  youtubeId: string;
  title: string;
  addedAt: string;
  addedBy?: string;
  reason?: string;
}

export interface ContentFilterConfig {
  enabled: boolean;
  defaultDeny: boolean;
  allowedCategories: AllowedCategory[];
  whitelist: WhitelistItem[];
  blockedKeywords: string[];
  maxResults: number;
  pinCode?: string;
}

export interface FilterResult {
  allowed: boolean;
  reason?: string;
  matchedRule?: 'whitelist' | 'category' | 'keyword' | 'default_deny';
}
