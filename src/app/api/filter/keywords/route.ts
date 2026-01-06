import { NextRequest, NextResponse } from 'next/server';
import { 
  loadFilterConfig,
  addBlockedKeyword,
  removeBlockedKeyword 
} from '@/lib/content-filter';

export async function GET() {
  try {
    const config = loadFilterConfig();
    
    return NextResponse.json({
      keywords: config.blockedKeywords,
      total: config.blockedKeywords.length,
    });
  } catch (error) {
    console.error('Error getting blocked keywords:', error);
    return NextResponse.json(
      { error: 'فشل جلب الكلمات المحظورة' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword } = body;
    
    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json(
        { error: 'يجب تحديد الكلمة المحظورة' },
        { status: 400 }
      );
    }
    
    const trimmedKeyword = keyword.trim();
    if (trimmedKeyword.length < 2) {
      return NextResponse.json(
        { error: 'الكلمة يجب أن تكون أطول من حرفين' },
        { status: 400 }
      );
    }
    
    addBlockedKeyword(trimmedKeyword);
    
    const config = loadFilterConfig();
    
    return NextResponse.json({
      success: true,
      keywords: config.blockedKeywords,
    });
  } catch (error) {
    console.error('Error adding blocked keyword:', error);
    return NextResponse.json(
      { error: 'فشل إضافة الكلمة المحظورة' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    
    if (!keyword) {
      return NextResponse.json(
        { error: 'يجب تحديد الكلمة المحظورة' },
        { status: 400 }
      );
    }
    
    const removed = removeBlockedKeyword(keyword);
    
    if (!removed) {
      return NextResponse.json(
        { error: 'الكلمة غير موجودة في القائمة' },
        { status: 404 }
      );
    }
    
    const config = loadFilterConfig();
    
    return NextResponse.json({
      success: true,
      keywords: config.blockedKeywords,
    });
  } catch (error) {
    console.error('Error removing blocked keyword:', error);
    return NextResponse.json(
      { error: 'فشل حذف الكلمة المحظورة' },
      { status: 500 }
    );
  }
}