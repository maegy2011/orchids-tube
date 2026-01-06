import { Metadata, ResolvingMetadata } from 'next';
import { cache } from 'react';
import { getVideoDetails } from '@/lib/youtube';
import { filterContent } from '@/lib/content-filter';
import WatchDynamic from './WatchDynamic';

interface Props {
  params: Promise<{ id: string }>;
}

const fetchVideoData = cache(async (id: string) => {
  try {
    const videoData = await getVideoDetails(id);
    if (!videoData) return { video: null, error: 'الفيديو غير موجود', blocked: false };

    const filterResult = filterContent(
      videoData.id,
      'video',
      videoData.title,
      videoData.description,
      videoData.keywords,
      videoData.channelId
    );

    if (!filterResult.allowed) {
      return { 
        video: null, 
        error: 'المحتوى غير مسموح به', 
        blocked: true, 
        reason: filterResult.reason 
      };
    }

    return { video: videoData, error: null, blocked: false };
  } catch (err) {
    console.error('Error fetching video for SEO:', err);
    return { video: null, error: 'حدث خطأ أثناء جلب البيانات', blocked: false };
  }
});

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const { video } = await fetchVideoData(id);

  if (!video) {
    return {
      title: 'فيديو غير متاح',
      description: 'هذا الفيديو غير متاح حالياً',
    };
  }

  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: video.title,
    description: video.description?.slice(0, 160) || `شاهد ${video.title} على منصتنا مع ميزة الملاحظات الذكية`,
    openGraph: {
      title: video.title,
      description: video.description?.slice(0, 160),
      url: `https://yourdomain.com/watch/${id}`,
      siteName: 'منصة المشاهدة الذكية',
      images: [
        {
          url: video.thumbnail,
          width: 1280,
          height: 720,
          alt: video.title,
        },
        ...previousImages,
      ],
      type: 'video.other',
    },
    twitter: {
      card: 'summary_large_image',
      title: video.title,
      description: video.description?.slice(0, 160),
      images: [video.thumbnail],
    },
    alternates: {
      canonical: `/watch/${id}`,
    },
  };
}

export default async function WatchPage({ params }: Props) {
  const { id } = await params;
  const { video, error, blocked, reason } = await fetchVideoData(id);

  return (
    <WatchDynamic 
      initialVideo={video} 
      initialError={error} 
      initialBlocked={blocked} 
      initialBlockReason={reason || null}
    />
  );
}