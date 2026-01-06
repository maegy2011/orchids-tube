import { NextRequest, NextResponse } from 'next/server';
import { getVideoDetails } from '@/lib/youtube';
import { filterContent } from '@/lib/content-filter';

const ERROR_MESSAGES: Record<string, string> = {
  'Video unavailable': 'الفيديو غير متاح أو تم حذفه',
  'Private video': 'هذا الفيديو خاص',
  'Sign in to confirm': 'هذا الفيديو يتطلب تسجيل الدخول',
  'Video is unavailable': 'الفيديو غير متاح في منطقتك',
  'This video is not available': 'هذا الفيديو غير متاح',
  'default': 'حدث خطأ أثناء جلب معلومات الفيديو. يرجى المحاولة لاحقاً.',
};

function getErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  
  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (key !== 'default' && message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return ERROR_MESSAGES.default;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || id.length < 5) {
    return NextResponse.json({ 
      error: 'معرف الفيديو غير صالح',
      blocked: false 
    }, { status: 400 });
  }

    try {
      console.log(`Fetching video details for ID: ${id}`);
      const videoData = await getVideoDetails(id);
      
      if (!videoData) {
        console.warn(`Video not found for ID: ${id}`);
        return NextResponse.json({ 
          error: 'الفيديو غير موجود. قد يكون محذوفاً أو خاصاً.',
          blocked: false 
        }, { status: 404 });
      }

      console.log(`Video found: ${videoData.title}. Running filter...`);
      const filterResult = filterContent(
        videoData.id,
        'video',
        videoData.title,
        videoData.description,
        videoData.keywords,
        videoData.channelId
      );

      if (!filterResult.allowed) {
        console.warn(`Video blocked by filter: ${id}. Reason: ${filterResult.reason}`);
        return NextResponse.json({ 
          error: 'المحتوى غير مسموح به',
          reason: filterResult.reason,
          blocked: true
        }, { status: 403 });
      }

      console.log(`Video allowed: ${id}`);
      return NextResponse.json({
        ...videoData,
        filterReason: filterResult.reason,
      });
    } catch (error) {
    console.error('Video info error:', error);
    return NextResponse.json({ 
      error: getErrorMessage(error),
      blocked: false 
    }, { status: 500 });
  }
}
