import { NextRequest, NextResponse } from 'next/server';
import { 
  loadFilterConfig, 
  saveFilterConfig, 
  getFilterStats,
  setFilterEnabled,
  setDefaultDeny,
  setPinCode,
  verifyPinCode
} from '@/lib/content-filter';

export async function GET() {
  try {
    const config = loadFilterConfig();
    const stats = getFilterStats();
    
    // Don't send the pinCode itself to the client
    const safeConfig = { ...config };
    const hasPin = !!safeConfig.pinCode;
    delete safeConfig.pinCode;
    
    return NextResponse.json({
      config: safeConfig,
      stats,
      hasPin
    });
  } catch (error) {
    console.error('Error getting filter config:', error);
    return NextResponse.json(
      { error: 'فشل جلب إعدادات التصفية' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, pin, newPin } = body;

    if (action === 'verify') {
      const isValid = verifyPinCode(pin);
      return NextResponse.json({ success: isValid });
    }

    if (action === 'setup') {
      const config = loadFilterConfig();
      if (config.pinCode) {
        return NextResponse.json({ error: 'الرمز السري موجود بالفعل' }, { status: 400 });
      }
      setPinCode(newPin);
      return NextResponse.json({ success: true });
    }

    if (action === 'update') {
      if (!verifyPinCode(pin)) {
        return NextResponse.json({ error: 'الرمز السري الحالي غير صحيح' }, { status: 401 });
      }
      setPinCode(newPin);
      return NextResponse.json({ success: true });
    }

    if (action === 'remove') {
      if (!verifyPinCode(pin)) {
        return NextResponse.json({ error: 'الرمز السري غير صحيح' }, { status: 401 });
      }
      setPinCode(undefined);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ ما' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { enabled, defaultDeny, pin } = body;
    
    // If PIN is required, verify it
    const config = loadFilterConfig();
    if (config.pinCode && !verifyPinCode(pin)) {
      return NextResponse.json({ error: 'الرمز السري غير صحيح' }, { status: 401 });
    }

    if (typeof enabled === 'boolean') {
      setFilterEnabled(enabled);
    }
    
    if (typeof defaultDeny === 'boolean') {
      setDefaultDeny(defaultDeny);
    }
    
    const updatedConfig = loadFilterConfig();
    const stats = getFilterStats();
    
    const safeConfig = { ...updatedConfig };
    delete safeConfig.pinCode;
    
    return NextResponse.json({
      success: true,
      config: safeConfig,
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