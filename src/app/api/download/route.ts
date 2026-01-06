import { NextRequest, NextResponse } from 'next/server';
import youtubedl from 'youtube-dl-exec';
import { ruhend } from 'ruhend-scraper';
import jocles from 'jocles';
import { createTask } from 'youtube-po-token-generator/lib/task';

// Fallback error messages in Arabic
const ERROR_MESSAGES: Record<string, string> = {
  'Video unavailable': 'الفيديو غير متاح أو تم حذفه',
  'Private video': 'هذا الفيديو خاص ولا يمكن تحميله',
  'Sign in to confirm your age': 'هذا الفيديو يتطلب تسجيل الدخول للتحقق من العمر',
  'Video is unavailable': 'الفيديو غير متاح في منطقتك',
  'default': 'حدث خطأ أثناء جلب معلومات الفيديو. يرجى المحاولة لاحقاً.',
};

function getErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (message.includes(key)) return value;
  }
  return ERROR_MESSAGES.default;
}

// Generate PO Token for better reliability
async function getPoToken() {
  try {
    const task = await createTask();
    const result = await task.start();
    return result.poToken;
  } catch (error) {
    console.warn('Failed to generate PO Token:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, quality, type } = body;

    if (!videoId) {
      return NextResponse.json({ error: 'معرف الفيديو مطلوب' }, { status: 400 });
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const poToken = await getPoToken();

    // Method 1: youtube-dl-exec (High Quality)
    try {
      const options: any = {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: poToken ? [`X-Po-Token: ${poToken}`] : [],
      };

      const info = await youtubedl(videoUrl, options);
      const formats = info.formats || [];
      
      let selectedFormat: any = null;

      if (type === 'audio') {
        const audioFormats = formats
          .filter((f: any) => f.vcodec === 'none' && f.acodec !== 'none')
          .sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0));
        
        const targetBitrate = parseInt(quality) || 128;
        selectedFormat = audioFormats.find((f: any) => (f.abr || 0) <= targetBitrate) || audioFormats[0];
      } else {
        const targetHeight = parseInt(quality) || 720;
        const videoWithAudio = formats
          .filter((f: any) => f.vcodec !== 'none' && f.acodec !== 'none')
          .sort((a: any, b: any) => {
            const aHeight = a.height || 0;
            const bHeight = b.height || 0;
            return Math.abs(aHeight - targetHeight) - Math.abs(bHeight - targetHeight);
          });
        
        selectedFormat = videoWithAudio[0] || formats.find((f: any) => f.vcodec !== 'none');
      }

      if (selectedFormat && selectedFormat.url) {
        return NextResponse.json({
          url: selectedFormat.url,
          videoId,
          quality: type === 'audio' ? `${selectedFormat.abr || 128}kbps` : `${selectedFormat.height || quality}p`,
          type,
          container: selectedFormat.ext || 'mp4',
          fileSize: selectedFormat.filesize 
            ? `${Math.round(selectedFormat.filesize / 1024 / 1024)} MB`
            : 'غير معروف',
          title: info.title,
          message: 'تم إنشاء رابط التحميل بنجاح (yt-dlp)'
        });
      }
    } catch (err) {
      console.warn('youtube-dl-exec failed, trying fallback:', err);
    }

    // Method 2: ruhend-scraper (Fallback)
    try {
      if (type === 'audio') {
        const res = await ruhend.ytmp3(videoUrl);
        if (res && res.download) {
          return NextResponse.json({
            url: res.download,
            videoId,
            quality: '128kbps',
            type: 'audio',
            container: 'mp3',
            title: res.title || 'Audio',
            message: 'تم التحميل عبر Ruhend'
          });
        }
      } else {
        const res = await ruhend.ytmp4(videoUrl);
        if (res && res.download) {
          return NextResponse.json({
            url: res.download,
            videoId,
            quality: '720p',
            type: 'video',
            container: 'mp4',
            title: res.title || 'Video',
            message: 'تم التحميل عبر Ruhend'
          });
        }
      }
    } catch (err) {
      console.warn('ruhend-scraper failed:', err);
    }

    // Method 3: jocles (Fallback)
    try {
      const res = await jocles.youtube(videoUrl);
      if (res && res.result) {
        const downloadUrl = type === 'audio' ? res.result.mp3 : res.result.mp4;
        if (downloadUrl) {
          return NextResponse.json({
            url: downloadUrl,
            videoId,
            quality: type === 'audio' ? '128kbps' : '720p',
            type,
            container: type === 'audio' ? 'mp3' : 'mp4',
            title: res.result.title || 'YouTube Content',
            message: 'تم التحميل عبر Jocles'
          });
        }
      }
    } catch (err) {
      console.warn('jocles failed:', err);
    }

    return NextResponse.json({ error: 'فشلت جميع طرق التحميل. يرجى المحاولة لاحقاً.' }, { status: 500 });

  } catch (error) {
    console.error('Download API Critical Error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get('videoId');
  
  if (!videoId) {
    return NextResponse.json({ error: 'معرف الفيديو مطلوب' }, { status: 400 });
  }

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    const info = await youtubedl(videoUrl, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
    });

    const formats = info.formats || [];
    
    const videoFormats = formats
      .filter((f: any) => f.vcodec !== 'none' && f.acodec !== 'none')
      .map((f: any) => ({
        itag: f.format_id,
        quality: `${f.height}p`,
        container: f.ext,
        size: f.filesize ? `${Math.round(f.filesize / 1024 / 1024)} MB` : 'غير معروف',
      }))
      .filter((v: any, i: number, a: any[]) => a.findIndex(t => t.quality === v.quality) === i)
      .sort((a: any, b: any) => parseInt(b.quality) - parseInt(a.quality));

    const audioFormats = formats
      .filter((f: any) => f.vcodec === 'none' && f.acodec !== 'none')
      .map((f: any) => ({
        itag: f.format_id,
        quality: `${Math.round(f.abr || 128)}kbps`,
        container: f.ext,
        size: f.filesize ? `${Math.round(f.filesize / 1024 / 1024)} MB` : 'غير معروف',
      }))
      .filter((v: any, i: number, a: any[]) => a.findIndex(t => t.quality === v.quality) === i)
      .sort((a: any, b: any) => parseInt(b.quality) - parseInt(a.quality))
      .slice(0, 5);

    return NextResponse.json({
      title: info.title,
      duration: info.duration,
      thumbnail: info.thumbnail,
      videoFormats,
      audioFormats,
    });
  } catch (error) {
    console.error('Get formats error:', error);
    return NextResponse.json({
      title: 'YouTube Video',
      videoFormats: [{ quality: '720p', container: 'mp4', size: 'غير معروف' }, { quality: '360p', container: 'mp4', size: 'غير معروف' }],
      audioFormats: [{ quality: '128kbps', container: 'm4a', size: 'غير معروف' }],
    });
  }
}
