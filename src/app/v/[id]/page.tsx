import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getVideoDetails } from '@/lib/youtube';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const video = await getVideoDetails(id);
    if (!video) return { title: 'فيديو غير موجود' };

    return {
      title: video.title,
      description: video.description?.slice(0, 160) || `شاهد ${video.title} عبر الرابط السريع`,
      openGraph: {
        title: video.title,
        description: video.description?.slice(0, 160),
        images: [{ url: video.thumbnail }],
      },
      twitter: {
        card: 'summary_large_image',
        images: [video.thumbnail],
      },
    };
  } catch (err) {
    return { title: 'منصة المشاهدة الذكية' };
  }
}

export default async function ShortLinkPage({ params }: Props) {
  const { id } = await params;
  redirect(`/watch/${id}`);
}
