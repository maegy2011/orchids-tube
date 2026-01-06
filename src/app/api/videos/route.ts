import { NextResponse } from 'next/server';
import { filterContent } from '@/lib/content-filter';

interface VideoData {
  id: string;
  thumbnail: string;
  duration: string;
  title: string;
  channelName: string;
  channelAvatar: string;
  views: string;
  postedAt: string;
  isVerified: boolean;
  videoUrl: string;
  filterReason?: string;
}

async function fetchYouTubeVideos(location?: string): Promise<VideoData[]> {
  try {
    const searchQueries = ['تعلم البرمجة', 'محاضرات دينية', 'وثائقيات علمية', 'تاريخ إسلامي', 'قصص القرآن'];
    const randomQuery = searchQueries[Math.floor(Math.random() * searchQueries.length)];
    
    // Map location to YouTube region code
    const regionMap: Record<string, string> = {
      'مصر': 'EG',
      'السعودية': 'SA',
      'الإمارات': 'AE',
      'المغرب': 'MA',
      'us': 'US',
      'uk': 'GB',
      'france': 'FR',
      'spain': 'ES',
      'china': 'CN',
      'japan': 'JP',
      'italy': 'IT',
      'germany': 'DE',
      'portugal': 'PT',
      'turkey': 'TR',
      'iran': 'IR'
    };
    
    const region = location ? regionMap[location] : 'EG';
    const lang = region === 'US' || region === 'GB' ? 'en-US' : 'ar-SA';
    
    const response = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(randomQuery)}&gl=${region}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept-Language': `${lang},en;q=0.9`,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch YouTube: ${response.status}`);
    }

    const html = await response.text();
    
    const scriptStart = html.indexOf('var ytInitialData = ');
    if (scriptStart === -1) {
      throw new Error('Could not find ytInitialData');
    }
    
    const start = scriptStart + 'var ytInitialData = '.length;
    let depth = 0;
    let end = start;
    let inString = false;
    let escapeNext = false;
    
    for (let i = start; i < html.length && i < start + 1000000; i++) {
      const char = html[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') depth++;
        if (char === '}') {
          depth--;
          if (depth === 0) {
            end = i + 1;
            break;
          }
        }
      }
    }
    
    const jsonStr = html.slice(start, end);
    const jsonData = JSON.parse(jsonStr);
    
    return extractVideos(jsonData);
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

function extractVideos(data: Record<string, unknown>): VideoData[] {
  const videos: VideoData[] = [];
  const seenIds = new Set<string>();
  
  function findVideos(obj: unknown): void {
    if (!obj || typeof obj !== 'object') return;
    
    if (Array.isArray(obj)) {
      obj.forEach(findVideos);
      return;
    }
    
    const record = obj as Record<string, unknown>;
    
    const vr = record.videoRenderer as Record<string, unknown> | undefined;
    
    if (vr && typeof vr === 'object') {
      const videoId = vr.videoId as string | undefined;
      
      if (videoId && !seenIds.has(videoId)) {
        seenIds.add(videoId);
        
        const thumbnails = (vr.thumbnail as Record<string, unknown>)?.thumbnails as Array<Record<string, unknown>> | undefined;
        let thumbnail = thumbnails?.slice(-1)[0]?.url as string || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        if (thumbnail.startsWith('//')) thumbnail = `https:${thumbnail}`;
        
        const titleRuns = (vr.title as Record<string, unknown>)?.runs as Array<Record<string, unknown>> | undefined;
        const title = titleRuns?.[0]?.text as string || 
          (vr.title as Record<string, unknown>)?.accessibility?.accessibilityData?.label as string || 'Untitled';
        
        const ownerRuns = (vr.ownerText as Record<string, unknown>)?.runs as Array<Record<string, unknown>> | undefined;
        const longBylineRuns = (vr.longBylineText as Record<string, unknown>)?.runs as Array<Record<string, unknown>> | undefined;
        const channelName = ownerRuns?.[0]?.text as string || longBylineRuns?.[0]?.text as string || 'Unknown';
        
        const channelThumbnailRenderer = (vr.channelThumbnailSupportedRenderers as Record<string, unknown>)?.channelThumbnailWithLinkRenderer as Record<string, unknown> | undefined;
        const channelThumbnails = (channelThumbnailRenderer?.thumbnail as Record<string, unknown>)?.thumbnails as Array<Record<string, unknown>> | undefined;
        let channelAvatar = channelThumbnails?.[0]?.url as string || '';
        if (channelAvatar.startsWith('//')) channelAvatar = `https:${channelAvatar}`;
        
        const viewCountText = vr.viewCountText as Record<string, unknown> | undefined;
        const shortViewCount = vr.shortViewCountText as Record<string, unknown> | undefined;
        const views = viewCountText?.simpleText as string || 
          shortViewCount?.simpleText as string ||
          (viewCountText?.runs as Array<Record<string, unknown>>)?.[0]?.text as string || '';
        
        const publishedTimeText = vr.publishedTimeText as Record<string, unknown> | undefined;
        const postedAt = publishedTimeText?.simpleText as string || '';
        
        const lengthText = vr.lengthText as Record<string, unknown> | undefined;
        const duration = lengthText?.simpleText as string || '';
        
        const ownerBadges = vr.ownerBadges as Array<Record<string, unknown>> | undefined;
        const isVerified = ownerBadges?.some(badge => {
          const renderer = badge?.metadataBadgeRenderer as Record<string, unknown> | undefined;
          return renderer?.style === 'BADGE_STYLE_TYPE_VERIFIED' || renderer?.style === 'BADGE_STYLE_TYPE_VERIFIED_ARTIST';
        }) || false;
        
        videos.push({
          id: videoId,
          thumbnail,
          duration,
          title,
          channelName,
          channelAvatar,
          views,
          postedAt,
          isVerified,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        });
      }
    }
    
    Object.values(record).forEach(findVideos);
  }
  
  findVideos(data);
  return videos.slice(0, 50);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location') || undefined;
    
    const allVideos = await fetchYouTubeVideos(location);
    
    // Apply filtering
    const filteredVideos = allVideos.filter(video => {
      const result = filterContent(
        video.id,
        'video',
        video.title,
        '', // Description not available in this fetcher
        [], // Tags not available
      );
      
      if (result.allowed) {
        video.filterReason = result.reason;
        return true;
      }
      return false;
    });
    
    if (filteredVideos.length === 0) {
      return NextResponse.json({ 
        videos: [], 
        error: 'No allowed videos found',
        filtered: true
      }, { status: 200 });
    }

    return NextResponse.json({ 
      videos: filteredVideos,
      filtered: true,
      totalCount: filteredVideos.length
    }, { 
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      videos: [], 
      error: error instanceof Error ? error.message : 'Failed to fetch videos' 
    }, { status: 500 });
  }
}