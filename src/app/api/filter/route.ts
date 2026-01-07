import { NextRequest, NextResponse } from 'next/server';
import { 
  loadFilterConfig, 
  saveFilterConfig, 
  getFilterStats,
  setFilterEnabled,
  setDefaultDeny
} from '@/lib/content-filter';

export async function GET() {
  try {
    const config = loadFilterConfig();
    const stats = getFilterStats();
    
    return NextResponse.json({
      config,
      stats
    });
  } catch (error) {
    console.error('Error getting filter config:', error);
    return NextResponse.json(
      { error: 'فشل جلب إعدادات التصفية' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { enabled, defaultDeny } = body;
    
    if (typeof enabled === 'boolean') {
      setFilterEnabled(enabled);
    }
    
    if (typeof defaultDeny === 'boolean') {
      setDefaultDeny(defaultDeny);
    }
    
    const updatedConfig = loadFilterConfig();
    const stats = getFilterStats();
    
    return NextResponse.json({
      success: true,
      config: updatedConfig,
      stats,
    });
  } catch (error) {
    console.error('Error updating filter config:', error);
    return NextResponse.json(
      { error: 'فشل تحديث إعدادات التصفية' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const currentConfig = loadFilterConfig();
    
    const newConfig = {
      ...currentConfig,
      ...body,
    };
    
    saveFilterConfig(newConfig);
    
    return NextResponse.json({
      success: true,
      config: newConfig,
    });
  } catch (error) {
    console.error('Error replacing filter config:', error);
    return NextResponse.json(
      { error: 'فشل استبدال إعدادات التصفية' },
      { status: 500 }
    );
  }
}
