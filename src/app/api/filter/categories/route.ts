import { NextRequest, NextResponse } from 'next/server';
import { 
  loadFilterConfig,
  updateAllowedCategories 
} from '@/lib/content-filter';
import { AllowedCategory } from '@/lib/types';

const VALID_CATEGORIES: AllowedCategory[] = [
  'education',
  'quran',
  'programming',
  'science',
  'documentary',
  'kids',
  'language',
  'history',
  'health',
  'mathematics',
  'business',
  'cooking',
  'crafts',
  'nature',
];

const CATEGORY_LABELS: Record<AllowedCategory, string> = {
  education: 'تعليم',
  quran: 'قرآن',
  programming: 'برمجة',
  science: 'علوم',
  documentary: 'وثائقي',
  kids: 'أطفال',
  language: 'لغات',
  history: 'تاريخ',
  health: 'صحة',
  mathematics: 'رياضيات',
  business: 'أعمال',
  cooking: 'طبخ',
  crafts: 'حرف يدوية',
  nature: 'طبيعة',
};

export async function GET() {
  try {
    const config = loadFilterConfig();
    
    const allCategories = VALID_CATEGORIES.map(cat => ({
      id: cat,
      label: CATEGORY_LABELS[cat],
      enabled: config.allowedCategories.includes(cat),
    }));
    
    return NextResponse.json({
      categories: allCategories,
      allowedCategories: config.allowedCategories,
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    return NextResponse.json(
      { error: 'فشل جلب الفئات' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { categories } = body;
    
    if (!Array.isArray(categories)) {
      return NextResponse.json(
        { error: 'يجب تحديد قائمة الفئات' },
        { status: 400 }
      );
    }
    
    const validCategories = categories.filter(
      (cat: string) => VALID_CATEGORIES.includes(cat as AllowedCategory)
    ) as AllowedCategory[];
    
    updateAllowedCategories(validCategories);
    
    const config = loadFilterConfig();
    
    return NextResponse.json({
      success: true,
      allowedCategories: config.allowedCategories,
    });
  } catch (error) {
    console.error('Error updating categories:', error);
    return NextResponse.json(
      { error: 'فشل تحديث الفئات' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, enabled } = body;
    
    if (!category || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'يجب تحديد الفئة والحالة' },
        { status: 400 }
      );
    }
    
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: 'فئة غير صالحة' },
        { status: 400 }
      );
    }
    
    const config = loadFilterConfig();
    let updatedCategories = [...config.allowedCategories];
    
    if (enabled && !updatedCategories.includes(category)) {
      updatedCategories.push(category);
    } else if (!enabled) {
      updatedCategories = updatedCategories.filter(cat => cat !== category);
    }
    
    updateAllowedCategories(updatedCategories);
    
    return NextResponse.json({
      success: true,
      allowedCategories: updatedCategories,
    });
  } catch (error) {
    console.error('Error toggling category:', error);
    return NextResponse.json(
      { error: 'فشل تغيير حالة الفئة' },
      { status: 500 }
    );
  }
}