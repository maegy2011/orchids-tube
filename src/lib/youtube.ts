import { Innertube, UniversalCache, YTNodes } from 'youtubei.js';
import ytSearch from 'yt-search';
import YouTubeSR from 'youtube-sr';
import youtubeSearchApi from 'youtube-search-api';
import { search as ytSearchNoApi } from 'youtube-search-without-api-key';
import ytubeNoApi from 'ytube-noapi';

let innertube: Innertube | null = null;

export async function getYouTube() {
  if (!innertube) {
    try {
      innertube = await Innertube.create({
        cache: new UniversalCache(false),
        generate_session_locally: true,
      });
    } catch (error) {
      console.error('Failed to create Innertube instance:', error);
      return null;
    }
  }
  return innertube;
}

export type VideoDetail = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number | string;
  views: string;
  likes: string;
  uploadDate: string;
  channelName: string;
  channelAvatar: string;
  channelId: string;
  channelSubscribers: string;
  isVerified: boolean;
  keywords: string[];
  embedUrl: string;
  relatedVideos: any[];
  comments: any[];
};

export async function searchVideos(query: string, limit: number = 30) {
  const result = await searchVideosWithContinuation(query);
  return result.videos.slice(0, limit);
}

export async function searchVideosWithContinuation(query: string, token?: string, region?: string, lang?: string) {
  try {
    const yt = await getYouTube();
    if (yt) {
      let search;
      if (token) {
        // If we have a token, we can use it to get the next page
        try {
          const response = await yt.actions.execute('/search', { 
            continuation: token,
            parse: true 
          });
          
          const contents = (response as any).on_response_received_endpoints?.[0]?.append_continuation_items_action?.continuation_items;
          
          if (contents) {
            const videos = contents
              .filter((item: any) => item.type === 'Video')
              .map((v: any) => ({
                id: v.id,
                title: v.title?.toString() || '',
                description: v.description?.toString() || '',
                thumbnail: v.thumbnails?.[0]?.url || '',
                duration: v.duration?.text || '0:00',
                views: v.view_count?.text || '0',
                uploadedAt: v.published?.text || 'غير معروف',
                channelName: v.author?.name || 'غير معروف',
                channelAvatar: v.author?.thumbnails?.[0]?.url || '',
                channelId: v.author?.id || '',
                isVerified: v.author?.is_verified || false,
                url: `https://www.youtube.com/watch?v=${v.id}`,
              }));

            const nextToken = contents.find((item: any) => item.type === 'ContinuationItem')?.endpoint?.payload?.token;

            return {
              videos,
              hasMore: !!nextToken,
              continuationToken: nextToken || null
            };
          }
        } catch (e) {
          console.error('Continuation fetch failed:', e);
        }
      }

      // Initial search with region and language support
      search = await yt.search(query, { 
        type: 'video',
        location: region, // Innertube supports location/region
        language: lang // Innertube supports language
      });
      const videos = search.videos.map((v: any) => ({
        id: v.id,
        title: v.title?.toString() || '',
        description: v.description?.toString() || '',
        thumbnail: v.thumbnails?.[0]?.url || '',
        duration: v.duration?.text || '0:00',
        views: v.view_count?.text || '0',
        uploadedAt: v.published?.text || 'غير معروف',
        channelName: v.author?.name || 'غير معروف',
        channelAvatar: v.author?.thumbnails?.[0]?.url || '',
        channelId: v.author?.id || '',
        isVerified: v.author?.is_verified || false,
        url: `https://www.youtube.com/watch?v=${v.id}`,
      }));

      return {
        videos,
        hasMore: search.has_continuation,
        continuationToken: (search as any).continuation || null
      };
    }
  } catch (error) {
    console.error('youtubei.js search failed:', error);
  }

  // Fallback to existing logic if youtubei.js fails or not initialized
  const videos = await fallbackSearch(query);
  // If we have videos from fallback, we can still allow some pagination by returning hasMore: true
  // although we don't have a real token. The API will handle variations if no token is provided.
  return { 
    videos, 
    hasMore: videos.length >= 10, 
    continuationToken: null 
  };
}

async function fallbackSearch(query: string, limit: number = 30) {
  // 0. Try ytube-noapi (User requested)
  try {
    const results = await ytubeNoApi.searchVideos(query, limit);
    if (results && results.length > 0) {
      return results
        .filter((v: any) => v.type === 'video')
        .map((v: any) => ({
          id: v.id,
          title: v.title || '',
          description: v.description || '',
          thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
          duration: v.duration || '0:00',
          views: v.views || '0',
          uploadedAt: v.publishedTime || 'غير معروف',
          channelName: v.channelName || 'غير معروف',
          channelAvatar: v.channelThumbnail || '',
          channelId: v.channelId || '',
          isVerified: v.verified || false,
          url: v.url || `https://www.youtube.com/watch?v=${v.id}`,
        }));
    }
  } catch (error) {
    console.error('ytube-noapi search failed:', error);
  }

  // 1. Try youtube-sr
  try {
    const results = await YouTubeSR.search(query, {
      limit: limit,
      type: 'video',
      safeSearch: false
    });

    if (results && results.length > 0) {
      return results.map((v: any) => ({
        id: v.id,
        title: v.title || '',
        description: v.description || '',
        thumbnail: v.thumbnail?.url || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
        duration: v.durationFormatted || '0:00',
        views: v.views?.toLocaleString() || '0',
        uploadedAt: v.uploadedAt || 'غير معروف',
        channelName: v.channel?.name || 'غير معروف',
        channelAvatar: v.channel?.icon?.url || '',
        channelId: v.channel?.id || '',
        isVerified: false,
        url: `https://www.youtube.com/watch?v=${v.id}`,
      }));
    }
  } catch (error) {
    console.error('youtube-sr failed:', error);
  }

  // 2. Try youtube-search-api
  try {
    const results = await youtubeSearchApi.GetListByKeyword(query, false, limit);
    if (results && results.items && results.items.length > 0) {
      return results.items.map((v: any) => ({
        id: v.id,
        title: v.title || '',
        description: v.description || '',
        thumbnail: v.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
        duration: v.length?.simpleText || '0:00',
        views: v.viewCount?.short || '0',
        uploadedAt: v.publishedAt || 'غير معروف',
        channelName: v.channelTitle || v.author?.name || 'غير معروف',
        channelAvatar: '',
        channelId: v.channelId || '',
        isVerified: false,
        url: `https://www.youtube.com/watch?v=${v.id}`,
      }));
    }
  } catch (error) {
    console.error('youtube-search-api failed:', error);
  }

  // 3. Try youtube-search-without-api-key
  try {
    const results = await ytSearchNoApi(query);
    if (results && results.length > 0) {
      return results.slice(0, limit).map((v: any) => ({
        id: v.id.videoId,
        title: v.snippet.title || '',
        description: v.snippet.description || '',
        thumbnail: v.snippet.thumbnails.high.url || '',
        duration: '0:00',
        views: '0',
        uploadedAt: v.snippet.publishedAt || 'غير معروف',
        channelName: v.snippet.channelTitle || 'غير معروف',
        channelAvatar: '',
        channelId: v.snippet.channelId || '',
        isVerified: false,
        url: `https://www.youtube.com/watch?v=${v.id.videoId}`,
      }));
    }
  } catch (error) {
    console.error('youtube-search-without-api-key failed:', error);
  }

  // 4. Try yt-search
  try {
    const results = await ytSearch(query);
    const videos = results.videos.slice(0, limit);
    
    if (videos.length > 0) {
      return videos.map(v => ({
        id: v.videoId,
        title: v.title || '',
        description: v.description || '',
        thumbnail: v.thumbnail || v.image || '',
        duration: v.timestamp || '0:00',
        views: v.views?.toLocaleString() || '0',
        uploadedAt: v.ago || 'غير معروف',
        channelName: v.author?.name || 'غير معروف',
        channelAvatar: '',
        channelId: v.author?.url?.split('/').pop() || '',
        isVerified: false,
        url: v.url,
      }));
    }
  } catch (error) {
    console.error('yt-search failed:', error);
  }

  return [];
}

export async function getVideoDetails(id: string): Promise<VideoDetail | null> {
  // 0. Try ytube-noapi (User requested)
  try {
    const video = await ytubeNoApi.getVideo(id);
    if (video) {
      // Fetch related videos
      let relatedVideos: any[] = [];
      try {
        const related = await ytubeNoApi.getRelatedVideos(id);
        relatedVideos = (related || []).map((v: any) => ({
          id: v.id,
          title: v.title || '',
          thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
          duration: v.duration || '0:00',
          views: v.views || '0',
          channelName: v.channelName || 'غير معروف',
        }));
      } catch (e) {
        console.warn('ytube-noapi related videos failed:', e);
      }

      return {
        id: video.id || id,
        title: video.title || '',
        description: video.description || '',
        thumbnail: video.thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        duration: video.duration || 0,
        views: video.viewsFormatted || video.views?.toString() || '0',
        likes: '0', 
        uploadDate: video.publishedAt || 'غير معروف',
        channelName: video.channelName || 'غير معروف',
        channelAvatar: '', 
        channelId: video.channelId || '',
        channelSubscribers: 'غير معروف',
        isVerified: false,
        keywords: video.keywords || [],
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
        relatedVideos: relatedVideos,
        comments: [], 
      };
    }
  } catch (error) {
    console.error('ytube-noapi detail failed:', error);
  }

  // 1. Try youtubei.js for comprehensive details (comments, related videos, etc.)
  try {
    const yt = await getYouTube();
    if (yt) {
      const video = await yt.getInfo(id);
      
      const basicInfo = video.basic_info;
      const watchNext = video.watch_next_feed || [];
      const related = watchNext.filter((item: any) => item.type === 'Video') || [];
      
      let comments: any[] = [];
      try {
        const commentsData = await yt.getComments(id);
        comments = commentsData.contents.map((c: any) => ({
          authorName: c.author?.name || 'غير معروف',
          authorAvatar: c.author?.thumbnails?.[0]?.url || '',
          text: c.content?.toString() || '',
          published: c.published?.toString() || '',
          likes: c.vote_count?.toString() || '0',
        }));
      } catch (e) {
        console.warn('Could not fetch comments:', e);
      }

      const secondaryInfo = video.secondary_info as any;
      const primaryInfo = video.primary_info as any;

      return {
        id: basicInfo.id || id,
        title: basicInfo.title || '',
        description: (basicInfo as any).description || '',
        thumbnail: basicInfo.thumbnail?.[0]?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        duration: basicInfo.duration || 0,
        views: basicInfo.view_count?.toString() || '0',
        likes: primaryInfo?.short_view_count?.text || '0',
        uploadDate: primaryInfo?.published?.text || 'غير معروف',
        channelName: basicInfo.author || 'غير معروف',
        channelAvatar: secondaryInfo?.author?.thumbnails?.[0]?.url || '',
        channelId: basicInfo.channel_id || '',
        channelSubscribers: secondaryInfo?.author?.subscribe_button?.subscriber_count?.text || 'غير معروف',
        isVerified: secondaryInfo?.author?.is_verified || false,
        keywords: basicInfo.keywords || [],
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
        relatedVideos: related.map((v: any) => ({
          id: v.id,
          title: v.title?.toString() || '',
          thumbnail: v.thumbnails?.[0]?.url || '',
          duration: v.duration?.text || '0:00',
          views: v.view_count?.text || '0',
          channelName: v.author?.name || 'غير معروف',
        })),
        comments: comments,
      };
    }
  } catch (error) {
    console.error('youtubei.js detail failed:', error);
  }

  // 2. Try youtube-sr for video details
  try {
    const video = await YouTubeSR.getVideo(`https://www.youtube.com/watch?v=${id}`);
    if (video) {
      return {
        id: video.id || id,
        title: video.title || '',
        description: video.description || '',
        thumbnail: video.thumbnail?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        duration: video.duration || 0,
        views: video.views?.toLocaleString() || '0',
        likes: '0',
        uploadDate: video.uploadedAt || 'غير معروف',
        channelName: video.channel?.name || 'غير معروف',
        channelAvatar: video.channel?.icon?.url || '',
        channelId: video.channel?.id || '',
        channelSubscribers: 'غير معروف',
        isVerified: false,
        keywords: [],
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
        relatedVideos: [],
        comments: [],
      };
    }
  } catch (error) {
    console.error('youtube-sr detail failed:', error);
  }

  // 3. Fallback to youtube-search-api
  try {
    const result = await youtubeSearchApi.GetVideoDetails(id);
    if (result) {
      return {
        id: id,
        title: result.title,
        description: result.description || '',
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        duration: 0,
        views: 'غير معروف',
        likes: '0',
        uploadDate: 'غير معروف',
        channelName: result.channelTitle || 'غير معروف',
        channelAvatar: '',
        channelId: result.channelId || '',
        channelSubscribers: 'غير معروف',
        isVerified: false,
        keywords: [],
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
        relatedVideos: [],
        comments: [],
      };
    }
  } catch (error) {
    console.error('youtube-search-api detail failed:', error);
  }

  // 4. Fallback to yt-search
  try {
    const result = await ytSearch({ videoId: id });
    if (result) {
      return {
        id: result.videoId,
        title: result.title,
        description: result.description,
        thumbnail: result.thumbnail || result.image || '',
        duration: result.seconds,
        views: result.views?.toLocaleString() || '0',
        likes: '0',
        uploadDate: result.ago || 'غير معروف',
        channelName: result.author?.name || 'غير معروف',
        channelAvatar: '',
        channelId: result.author?.url?.split('/').pop() || '',
        channelSubscribers: 'غير معروف',
        isVerified: false,
        keywords: [],
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
        relatedVideos: [],
        comments: [],
      };
    }
  } catch (e) {
    console.error('yt-search detail fallback failed:', e);
  }
  
  return null;
}
