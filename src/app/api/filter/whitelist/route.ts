import { NextRequest, NextResponse } from 'next/server';
import { 
  loadFilterConfig,
  addToWhitelist,
  removeFromWhitelist 
} from '@/lib/content-filter';
import { ContentType } from '@/lib/types';

export async function GET() {
  try {
    const config = loadFilterConfig();
    
    return NextResponse.json({
      whitelist: config.whitelist,
      total: config.whitelist.length,
    });
  } catch (error) {
    console.error('Error getting whitelist:', error);
    return NextResponse.json(
      { error: 'فشل جلب القائمة البيضاء' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { youtubeId, type, title, reason } = body;
    
    if (!youtubeId || !type || !title) {
      return NextResponse.json(
        { error: 'يجب تحديد معرف اليوتيوب والنوع والعنوان' },
        { status: 400 }
      );
    }
    
    const validTypes: ContentType[] = ['video', 'playlist', 'channel'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'نوع غير صالح. يجب أن يكون video أو playlist أو channel' },
        { status: 400 }
      );
    }
    
    const item = addToWhitelist(youtubeId, type, title, reason);
    
    return NextResponse.json({
      success: true,
      item,
    });
  } catch (error) {
    console.error('Error adding to whitelist:', error);
    return NextResponse.json(
      { error: 'فشل إضافة العنصر للقائمة البيضاء' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const youtubeId = searchParams.get('youtubeId');
    const type = searchParams.get('type') as ContentType;
    
    if (!youtubeId || !type) {
      return NextResponse.json(
        { error: 'يجب تحديد معرف اليوتيوب والنوع' },
        { status: 400 }
      );
    }
    
    const removed = removeFromWhitelist(youtubeId, type);
    
    if (!removed) {
      return NextResponse.json(
        { error: 'العنصر غير موجود في القائمة البيضاء' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'تم حذف العنصر من القائمة البيضاء',
    });
  } catch (error) {
    console.error('Error removing from whitelist:', error);
    return NextResponse.json(
      { error: 'فشل حذف العنصر من القائمة البيضاء' },
      { status: 500 }
    );
  }
}