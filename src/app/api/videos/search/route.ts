import { NextRequest, NextResponse } from 'next/server';
import { searchVideosWithContinuation } from '@/lib/youtube';
import { filterContent, loadFilterConfig } from '@/lib/content-filter';

const CATEGORY_SEARCH_TERMS: Record<string, string[]> = {
  education: ['تعليم', 'شرح', 'درس', 'كورس', 'تعلم', 'دورة تدريبية', 'محاضرات'],
  quran: ['قرآن', 'تلاوة خاشعة', 'تجويد', 'سورة كاملة', 'المصحف المرتل', 'القرآن الكريم'],
  programming: ['برمجة', 'تعلم البرمجة', 'كورس برمجة', 'تطوير الويب', 'جافا سكريبت', 'بايثون'],
  science: ['علوم', 'وثائقي علمي', 'ناشيونال جيوغرافيك', 'حقائق علمية', 'تجربة علمية'],
  documentary: ['وثائقي', 'فيلم وثائقي', 'قصة حقيقية', 'تاريخي وثائقي', 'أسرار العالم'],
  kids: ['أطفال', 'تعليم أطفال', 'أناشيد أطفال', 'قصص للأطفال', 'كرتون تعليمي'],
  language: ['تعلم اللغة', 'تعلم الإنجليزية', 'محادثة إنجليزية', 'قواعد اللغة', 'نطق صحيح'],
  history: ['تاريخ', 'وثائقي تاريخي', 'حضارات قديمة', 'ملوك وأباطرة', 'قصص من التاريخ'],
  health: ['صحة', 'طب', 'تمارين رياضية', 'نظام غذائي', 'فوائد صحية', 'علاج طبيعي'],
  mathematics: ['رياضيات', 'حساب', 'جبر', 'هندسة', 'شرح رياضيات', 'مسائل رياضية'],
  business: ['أعمال', 'تسويق', 'ريادة أعمال', 'إدارة مشاريع', 'نصائح تجارية', 'اقتصاد'],
  cooking: ['طبخ', 'وصفات طعام', 'مطبخ عربي', 'حلويات', 'أكلات سريعة', 'طريقة عمل'],
  crafts: ['حرف يدوية', 'diy', 'فنون', 'رسم', 'تصميم', 'أفكار إبداعية'],
  nature: ['طبيعة', 'حيوانات', 'وثائقي طبيعة', 'جمال الطبيعة', 'عالم الحيوان'],
  tech: ['تقنية', 'مراجعة هواتف', 'كمبيوتر', 'تكنولوجيا', 'أحدث الاختراعات', 'برامج'],
  ai: ['ذكاء اصطناعي', 'ai', 'مستقبل التقنية', 'روبوتات', 'شات جي بي تي'],
};

function enhanceQueryForAllowedContent(query: string, allowedCategories: string[]): string[] {
  const queries: string[] = [query];
  
  // Mix in 3-4 different variations to maximize results
  const shuffledCategories = [...allowedCategories].sort(() => 0.5 - Math.random());
  const selectedCategories = shuffledCategories.slice(0, 3);
  
  for (const category of selectedCategories) {
    const terms = CATEGORY_SEARCH_TERMS[category];
    if (terms && terms.length > 0) {
      // Add a random term from this category
      const randomTerm = terms[Math.floor(Math.random() * terms.length)];
      queries.push(`${query} ${randomTerm}`);
    }
  }
  
  return queries;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const token = searchParams.get('token');
  const location = searchParams.get('location') || undefined;
  const language = searchParams.get('language') || undefined;
  const restricted = searchParams.get('restricted') === 'true';
  const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 100);
  const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ 
      error: 'يرجى إدخال كلمة للبحث',
      videos: [], 
      totalResults: 0 
    }, { status: 400 });
  }

  try {
    const config = loadFilterConfig();
    const searchQueries = (restricted && config.defaultDeny && !token)
      ? enhanceQueryForAllowedContent(query, config.allowedCategories)
      : [query];
    
    // Map location to YouTube region code
    const regionMap: Record<string, string> = {
      'egypt': 'EG', 'saudi': 'SA', 'uae': 'AE', 'morocco': 'MA',
      'us': 'US', 'uk': 'GB', 'france': 'FR', 'spain': 'ES',
      'china': 'CN', 'japan': 'JP', 'italy': 'IT', 'germany': 'DE',
      'portugal': 'PT', 'turkey': 'TR', 'iran': 'IR',
      'مصر': 'EG', 'السعودية': 'SA', 'الإمارات': 'AE', 'المغرب': 'MA',
      'إيران': 'IR', 'تركيا': 'TR'
    };
    const region = location ? regionMap[location] : undefined;

    const allResults: Map<string, any> = new Map();
    let currentToken: string | null = token;
    let hasMore = true;
    let filteredVideos: any[] = [];
    let fetchCount = 0;
    const MAX_FETCH_ATTEMPTS = 12; // Significantly increased to guarantee results

    // Improved fetching logic: if we don't have enough videos after filtering, fetch more aggressively
    while (filteredVideos.length < limit && hasMore && fetchCount < MAX_FETCH_ATTEMPTS) {
      const batchResults: any[] = [];
      
      if (currentToken) {
        // Fetch more via token
        const result = await searchVideosWithContinuation(query, currentToken, region, language);
        batchResults.push(...result.videos);
        currentToken = result.continuationToken;
        hasMore = result.hasMore;
      } else if (fetchCount === 0) {
        // Initial multi-query search
        for (const sQ of searchQueries) {
          try {
            const result = await searchVideosWithContinuation(sQ, undefined, region, language);
            batchResults.push(...result.videos);
            if (sQ === query) {
              currentToken = result.continuationToken;
              hasMore = result.hasMore;
            }
          } catch (err) {
            console.error(`Search query "${sQ}" failed:`, err);
          }
        }
      } else if (hasMore && currentToken === null && fetchCount > 0) {
        // If we still need more but lost the token, try variations of the query to find more content
        const variations = enhanceQueryForAllowedContent(query, config.allowedCategories);
        const randomVariation = variations[Math.floor(Math.random() * variations.length)];
        try {
          const result = await searchVideosWithContinuation(randomVariation, undefined, region, language);
          batchResults.push(...result.videos);
          currentToken = result.continuationToken;
          hasMore = result.hasMore;
        } catch (err) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }

      // Filter the new batch
      for (const video of batchResults) {
        if (allResults.has(video.id)) continue;
        allResults.set(video.id, video);

        const filterResult = filterContent(
          video.id,
          'video',
          video.title,
          video.description,
          [],
          video.channelId,
          restricted
        );
        
        if (filterResult.allowed) {
          filteredVideos.push({
            ...video,
            filterReason: filterResult.reason,
          });
        }
      }

      fetchCount++;
      if (!currentToken && fetchCount > 0 && batchResults.length === 0) hasMore = false;
    }

    return NextResponse.json({ 
      videos: filteredVideos.slice(0, limit), 
      continuationToken: currentToken,
      hasMore: hasMore || filteredVideos.length > limit,
      page,
      query: query,
      debug: {
        attempts: fetchCount,
        totalFound: allResults.size,
        totalAllowed: filteredVideos.length
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء البحث. يرجى المحاولة لاحقاً.', 
      videos: [], 
      totalResults: 0 
    }, { status: 500 });
  }
}
