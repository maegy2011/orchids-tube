"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Shield, 
  Settings, 
  List, 
  Tag, 
  Ban,
  Plus,
  Trash2,
  Check,
  X,
  RefreshCw,
  Home,
  Video,
  Users,
  ListVideo,
  ChevronLeft,
  Search,
  AlertCircle,
  CheckCircle2,
  Settings2,
  ArrowRight,
  Lock,
  Unlock,
  KeyRound,
  Fingerprint
} from 'lucide-react';
import { 
  InputOTP, 
  InputOTPGroup, 
  InputOTPSlot 
} from "@/components/ui/input-otp";
import { ContentFilterConfig, WhitelistItem, AllowedCategory, ContentType } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import { useI18n } from '@/lib/i18n-context';
import { getDaysUntilRamadan } from '@/lib/date-utils';

interface CategoryInfo {
  id: AllowedCategory;
  label: string;
  enabled: boolean;
}

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

export default function ContentFilterAdminPage() {
  const { showRamadanCountdown } = useI18n();
  const [config, setConfig] = useState<ContentFilterConfig | null>(null);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [whitelist, setWhitelist] = useState<WhitelistItem[]>([]);
  const [blockedKeywords, setBlockedKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('settings');
  const [daysUntilRamadan, setDaysUntilRamadan] = useState<number | null>(null);

  useEffect(() => {
    setDaysUntilRamadan(getDaysUntilRamadan());
  }, []);

  const isRamadanCountdownVisible = showRamadanCountdown && daysUntilRamadan !== null && daysUntilRamadan > 0;
  const mainPaddingTop = isRamadanCountdownVisible ? 'pt-[104px] sm:pt-[100px]' : 'pt-[64px]';
  const headerTop = isRamadanCountdownVisible ? 'top-[40px] sm:top-[36px]' : 'top-0';
  
  // PIN related states
  const [hasPin, setHasPin] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [pinAction, setPinAction] = useState<'setup' | 'update' | 'remove' | 'verify'>('verify');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [newWhitelistItem, setNewWhitelistItem] = useState({
    youtubeId: '',
    type: 'video' as ContentType,
    title: '',
    reason: ''
  });
  const [newKeyword, setNewKeyword] = useState('');
  const [saving, setSaving] = useState(false);
  const [isAddWhitelistOpen, setIsAddWhitelistOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [configRes, categoriesRes, whitelistRes, keywordsRes] = await Promise.all([
        fetch('/api/filter'),
        fetch('/api/filter/categories'),
        fetch('/api/filter/whitelist'),
        fetch('/api/filter/keywords'),
      ]);

      const configData = await configRes.json();
      const categoriesData = await categoriesRes.json();
      const whitelistData = await whitelistRes.json();
      const keywordsData = await keywordsRes.json();

      setConfig(configData.config);
      setHasPin(configData.hasPin);
      setCategories(categoriesData.categories || []);
      setWhitelist(whitelistData.whitelist || []);
      setBlockedKeywords(keywordsData.keywords || []);
      
      if (!configData.hasPin) {
        setIsUnlocked(true);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleFilterEnabled = async (enabled: boolean) => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch('/api/filter', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, pin: pinInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setConfig(data.config);
        toast.success(enabled ? 'تم تفعيل نظام التصفية' : 'تم تعطيل نظام التصفية');
      } else {
        toast.error(data.error || 'فشل التحديث');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const toggleDefaultDeny = async (defaultDeny: boolean) => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch('/api/filter', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultDeny, pin: pinInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setConfig(data.config);
        toast.success(defaultDeny ? 'تم تفعيل الحظر الافتراضي' : 'تم تعطيل الحظر الافتراضي');
      } else {
        toast.error(data.error || 'فشل التحديث');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = async (categoryId: AllowedCategory, enabled: boolean) => {
    setSaving(true);
    try {
      const res = await fetch('/api/filter/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: categoryId, enabled }),
      });
      if (res.ok) {
        setCategories(prev => 
          prev.map(cat => 
            cat.id === categoryId ? { ...cat, enabled } : cat
          )
        );
        toast.success(`${enabled ? 'تم السماح بـ' : 'تم حظر'} فئة ${CATEGORY_LABELS[categoryId]}`);
      }
    } catch (error) {
      toast.error('فشل في تحديث الفئة');
    } finally {
      setSaving(false);
    }
  };

  const addToWhitelist = async () => {
    if (!newWhitelistItem.youtubeId || !newWhitelistItem.title) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/filter/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWhitelistItem),
      });
      if (res.ok) {
        const data = await res.json();
        setWhitelist(prev => [...prev, data.item]);
        setNewWhitelistItem({ youtubeId: '', type: 'video', title: '', reason: '' });
        setIsAddWhitelistOpen(false);
        toast.success('تمت الإضافة للقائمة البيضاء');
      }
    } catch (error) {
      toast.error('فشل في الإضافة للقائمة البيضاء');
    } finally {
      setSaving(false);
    }
  };

  const removeFromWhitelist = async (youtubeId: string, type: ContentType) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/filter/whitelist?youtubeId=${youtubeId}&type=${type}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setWhitelist(prev => prev.filter(item => !(item.youtubeId === youtubeId && item.type === type)));
        toast.success('تم الحذف من القائمة البيضاء');
      }
    } catch (error) {
      toast.error('فشل في الحذف من القائمة البيضاء');
    } finally {
      setSaving(false);
    }
  };

  const addKeyword = async () => {
    if (!newKeyword.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/filter/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: newKeyword.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setBlockedKeywords(data.keywords);
        setNewKeyword('');
        toast.success('تمت إضافة الكلمة المحظورة');
      }
    } catch (error) {
      toast.error('فشل في إضافة الكلمة');
    } finally {
      setSaving(false);
    }
  };

  const removeKeyword = async (keyword: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/filter/keywords?keyword=${encodeURIComponent(keyword)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        setBlockedKeywords(data.keywords);
        toast.success('تمت إزالة الكلمة المحظورة');
      }
    } catch (error) {
      toast.error('فشل في إزالة الكلمة');
    } finally {
      setSaving(false);
    }
  };

  const verifyPin = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', pin: pinInput }),
      });
      const data = await res.json();
      if (data.success) {
        setIsUnlocked(true);
        toast.success('تم فتح القفل بنجاح');
      } else {
        toast.error('الرمز السري غير صحيح');
        setPinInput('');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء التحقق');
    } finally {
      setSaving(false);
    }
  };

  const handlePinAction = async () => {
    if (!newPinInput && pinAction !== 'remove') {
      toast.error('يرجى إدخال الرمز السري الجديد');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: pinAction, 
          pin: pinInput, 
          newPin: newPinInput 
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          pinAction === 'setup' ? 'تم إعداد الرمز السري' : 
          pinAction === 'update' ? 'تم تحديث الرمز السري' : 'تم إزالة الرمز السري'
        );
        setIsPinDialogOpen(false);
        setPinInput('');
        setNewPinInput('');
        fetchData();
      } else {
        toast.error(data.error || 'فشلت العملية');
      }
    } catch (error) {
      toast.error('حدث خطأ ما');
    } finally {
      setSaving(false);
    }
  };

  const getTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'channel': return <Users className="w-4 h-4" />;
      case 'playlist': return <ListVideo className="w-4 h-4" />;
    }
  };

  const filteredWhitelist = useMemo(() => {
    if (!searchQuery) return whitelist;
    return whitelist.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.youtubeId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [whitelist, searchQuery]);

  const filteredKeywords = useMemo(() => {
    if (!searchQuery) return blockedKeywords;
    return blockedKeywords.filter(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [blockedKeywords, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <Shield className="w-16 h-16 text-red-600 animate-pulse" />
            <RefreshCw className="w-6 h-6 text-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
          </div>
          <p className="text-muted-foreground font-medium">جاري تهيئة النظام...</p>
        </motion.div>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="border-border shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto bg-red-600/10 w-20 h-20 rounded-full flex items-center justify-center">
                <Lock className="w-10 h-10 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">نظام التصفية مغلق</CardTitle>
                <CardDescription>أدخل الرمز السري للوصول إلى الإعدادات</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-8 py-8" dir="ltr">
              <InputOTP 
                maxLength={4} 
                value={pinInput} 
                onChange={setPinInput}
                onComplete={verifyPin}
                type="password"
              >
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot index={0} className="w-12 h-16 text-2xl border-2" />
                  <InputOTPSlot index={1} className="w-12 h-16 text-2xl border-2" />
                  <InputOTPSlot index={2} className="w-12 h-16 text-2xl border-2" />
                  <InputOTPSlot index={3} className="w-12 h-16 text-2xl border-2" />
                </InputOTPGroup>
              </InputOTP>
              
              <Button 
                onClick={verifyPin}
                disabled={saving || pinInput.length < 4}
                className="w-full h-12 text-lg bg-red-600 hover:bg-red-700"
              >
                {saving ? <RefreshCw className="w-6 h-6 animate-spin" /> : "فتح القفل الآن"}
              </Button>
            </CardContent>
            <CardFooter className="justify-center border-t border-border pt-6">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                <span>العودة للرئيسية</span>
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-red-500/30 pb-20 md:pb-0" dir="rtl">
      <Toaster position="top-center" />
      
        {/* Header */}
        <header className={`sticky ${headerTop} z-50 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-4 transition-all duration-300`}>
          <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 hover:bg-muted rounded-full transition-colors md:hidden">
              <ArrowRight className="w-6 h-6" />
            </Link>
            <div className="bg-red-600/10 p-2 rounded-xl">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">تصفية المحتوى</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest hidden md:block">ADMIN DASHBOARD</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUnlocked(false)}
              className="gap-2 border-border hover:bg-muted text-xs"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>إغلاق النظام</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchData}
              className="rounded-full hover:bg-muted"
            >
              <RefreshCw className={cn("w-5 h-5", saving && "animate-spin")} />
            </Button>
            <Button asChild variant="ghost" size="icon" className="rounded-full hover:bg-muted hidden md:flex">
              <Link href="/">
                <Home className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
        {/* System Overview */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
        >
          <Card className="bg-card border-border overflow-hidden group">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">الحالة</p>
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", config?.enabled ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-muted-foreground")} />
                  <span className="text-sm font-bold">{config?.enabled ? 'نشط' : 'متوقف'}</span>
                </div>
              </div>
              <Settings2 className="w-8 h-8 text-foreground/5 group-hover:text-red-600/20 transition-colors" />
            </CardContent>
          </Card>

          <Card className="bg-card border-border overflow-hidden group">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">القائمة البيضاء</p>
                <p className="text-xl font-black">{whitelist.length}</p>
              </div>
              <List className="w-8 h-8 text-foreground/5 group-hover:text-red-600/20 transition-colors" />
            </CardContent>
          </Card>

          <Card className="bg-card border-border overflow-hidden group">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">الفئات</p>
                <p className="text-xl font-black text-green-500">{categories.filter(c => c.enabled).length}</p>
              </div>
              <Tag className="w-8 h-8 text-foreground/5 group-hover:text-green-500/20 transition-colors" />
            </CardContent>
          </Card>

          <Card className="bg-card border-border overflow-hidden group">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">الكلمات</p>
                <p className="text-xl font-black text-red-500">{blockedKeywords.length}</p>
              </div>
              <Ban className="w-8 h-8 text-foreground/5 group-hover:text-red-500/20 transition-colors" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Tabs */}
        <Tabs defaultValue="settings" className="w-full" onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-6 overflow-x-auto no-scrollbar py-1">
            <TabsList className="bg-muted border border-border p-1 h-auto shrink-0">
              <TabsTrigger value="settings" className="flex items-center gap-2 px-4 py-2 rounded-md data-[state=active]:bg-red-600 data-[state=active]:text-white">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">الإعدادات</span>
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center gap-2 px-4 py-2 rounded-md data-[state=active]:bg-red-600 data-[state=active]:text-white">
                <Tag className="w-4 h-4" />
                <span className="hidden sm:inline">الفئات</span>
              </TabsTrigger>
              <TabsTrigger value="whitelist" className="flex items-center gap-2 px-4 py-2 rounded-md data-[state=active]:bg-red-600 data-[state=active]:text-white">
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">القائمة البيضاء</span>
              </TabsTrigger>
              <TabsTrigger value="keywords" className="flex items-center gap-2 px-4 py-2 rounded-md data-[state=active]:bg-red-600 data-[state=active]:text-white">
                <Ban className="w-4 h-4" />
                <span className="hidden sm:inline">الكلمات</span>
              </TabsTrigger>
            </TabsList>

            {(activeTab === 'whitelist' || activeTab === 'keywords') && (
              <div className="mr-4 relative hidden md:block w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="بحث سريع..." 
                  className="bg-muted border-border pr-9 focus:ring-red-600 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="settings" className="mt-0 space-y-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">الإعدادات العامة</CardTitle>
                    <CardDescription>تحكم في السلوك الأساسي لنظام تصفية المحتوى</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-xl hover:bg-muted/50 transition-colors group">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold">تفعيل نظام التصفية</p>
                          {config?.enabled ? (
                            <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/5 px-1 py-0 h-4 text-[10px]">ACTIVE</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground border-border bg-muted/5 px-1 py-0 h-4 text-[10px]">OFF</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">تشغيل أو إيقاف التصفية لجميع المستخدمين</p>
                      </div>
                      <Switch 
                        checked={config?.enabled} 
                        onCheckedChange={toggleFilterEnabled}
                        disabled={saving}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-xl hover:bg-muted/50 transition-colors group">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold">وضع الحظر الافتراضي</p>
                          {config?.defaultDeny && (
                            <Badge variant="outline" className="text-red-500 border-red-500/20 bg-red-500/5 px-1 py-0 h-4 text-[10px]">STRICT</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">حظر كل ما لا يطابق القواعد المسموحة</p>
                      </div>
                      <Switch 
                        checked={config?.defaultDeny} 
                        onCheckedChange={toggleDefaultDeny}
                        disabled={saving}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* PIN Management */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-1">
                      <KeyRound className="w-5 h-5 text-red-600" />
                      <CardTitle className="text-lg">الرمز السري</CardTitle>
                    </div>
                    <CardDescription>قم بتعيين رمز سري لحماية الإعدادات من التغيير العبثي</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-xl">
                      <div className="space-y-1">
                        <p className="font-bold">{hasPin ? 'النظام محمي برمز سري' : 'النظام غير محمي'}</p>
                        <p className="text-xs text-muted-foreground">
                          {hasPin ? 'يجب إدخال الرمز السري عند كل دخول أو تغيير للإعدادات' : 'ينصح بإضافة رمز سري لزيادة الأمان'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {hasPin ? (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setPinAction('update');
                                setIsPinDialogOpen(true);
                              }}
                              className="border-border hover:bg-muted"
                            >
                              تغيير الرمز
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setPinAction('remove');
                                setIsPinDialogOpen(true);
                              }}
                              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            >
                              إزالة الرمز
                            </Button>
                          </>
                        ) : (
                          <Button 
                            onClick={() => {
                              setPinAction('setup');
                              setIsPinDialogOpen(true);
                            }}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            إعداد الرمز السري
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-red-600/5 border-red-600/10">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 text-red-500 mb-1">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">تحذير</span>
                      </div>
                      <CardTitle className="text-base">تنبيه أمني</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        عند تفعيل "وضع الحظر الافتراضي"، سيتم منع الوصول إلى أي محتوى يوتيوب ما لم يكن مضافاً للقائمة البيضاء أو يندرج تحت تصنيف مسموح.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-green-600/5 border-green-600/10">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 text-green-500 mb-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">نصيحة</span>
                      </div>
                      <CardTitle className="text-base">أداء النظام</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        نظام التصفية يستخدم تقنيات متقدمة لفحص المحتوى، يمكنك إضافة الكلمات المحظورة الأكثر شيوعاً لتحسين دقة النظام.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="categories" className="mt-0">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">إدارة الفئات</CardTitle>
                    <CardDescription>اختر فئات المحتوى المسموح بها تلقائياً</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {categories.map((category) => (
                        <div
                          key={category.id}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-xl border transition-all duration-300",
                            category.enabled 
                              ? "bg-green-600/10 border-green-600/20 shadow-[0_0_15px_rgba(34,197,94,0.05)]" 
                              : "bg-muted/30 border-border opacity-70"
                          )}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{category.label}</span>
                            <span className="text-[10px] text-muted-foreground uppercase font-medium">{category.id}</span>
                          </div>
                          <Switch 
                            checked={category.enabled} 
                            onCheckedChange={(checked) => toggleCategory(category.id, checked)}
                            disabled={saving}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="whitelist" className="mt-0 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold">القائمة البيضاء</h2>
                    <p className="text-sm text-muted-foreground">المحتوى المستثنى من جميع قواعد الحظر</p>
                  </div>
                  
                  <Dialog open={isAddWhitelistOpen} onOpenChange={setIsAddWhitelistOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 gap-2">
                        <Plus className="w-4 h-4" />
                        <span>إضافة محتوى</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border text-foreground">
                      <DialogHeader>
                        <DialogTitle>إضافة للقائمة البيضاء</DialogTitle>
                        <DialogDescription className="text-muted-foreground">أدخل تفاصيل الفيديو أو القناة للسماح بها</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <label className="text-xs font-bold text-muted-foreground">نوع المحتوى</label>
                          <Select 
                            value={newWhitelistItem.type} 
                            onValueChange={(v) => setNewWhitelistItem(p => ({ ...p, type: v as ContentType }))}
                          >
                            <SelectTrigger className="bg-muted border-border">
                              <SelectValue placeholder="اختر النوع" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border text-popover-foreground">
                              <SelectItem value="video">فيديو</SelectItem>
                              <SelectItem value="channel">قناة</SelectItem>
                              <SelectItem value="playlist">قائمة تشغيل</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <label className="text-xs font-bold text-muted-foreground">معرف YouTube (ID)</label>
                          <Input 
                            value={newWhitelistItem.youtubeId}
                            onChange={(e) => setNewWhitelistItem(p => ({ ...p, youtubeId: e.target.value }))}
                            placeholder="مثال: dQw4w9WgXcQ"
                            className="bg-muted border-border focus:ring-red-600"
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-xs font-bold text-muted-foreground">العنوان التعريفي</label>
                          <Input 
                            value={newWhitelistItem.title}
                            onChange={(e) => setNewWhitelistItem(p => ({ ...p, title: e.target.value }))}
                            placeholder="اسم الفيديو أو القناة"
                            className="bg-muted border-border focus:ring-red-600"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          onClick={addToWhitelist} 
                          disabled={saving || !newWhitelistItem.youtubeId || !newWhitelistItem.title}
                          className="w-full bg-red-600 hover:bg-red-700"
                        >
                          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : "إضافة الآن"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="md:hidden relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="بحث في القائمة..." 
                    className="bg-muted border-border pr-9 focus:ring-red-600"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Card className="bg-card border-border">
                  <ScrollArea className="h-[500px]">
                    <CardContent className="p-0">
                      {filteredWhitelist.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                          <List className="w-12 h-12 mb-4" />
                          <p>لا توجد نتائج مطابقة</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {filteredWhitelist.map((item) => (
                            <motion.div
                              layout
                              key={item.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="group flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-muted rounded-xl text-muted-foreground group-hover:text-red-500 transition-colors">
                                  {getTypeIcon(item.type)}
                                </div>
                                <div className="space-y-0.5">
                                  <p className="font-bold text-sm leading-none">{item.title}</p>
                                  <div className="flex items-center gap-2">
                                    <code className="text-[10px] text-muted-foreground font-mono bg-muted px-1 rounded">{item.youtubeId}</code>
                                    <span className="text-[10px] text-muted-foreground/60">•</span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">{item.type}</span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFromWhitelist(item.youtubeId, item.type)}
                                className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </ScrollArea>
                </Card>
              </TabsContent>

              <TabsContent value="keywords" className="mt-0 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold">الكلمات المحظورة</h2>
                    <p className="text-sm text-muted-foreground">سيتم حظر أي محتوى يحتوي على هذه الكلمات في العنوان أو الوصف</p>
                  </div>
                </div>

                <Card className="bg-card border-border p-4">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="أدخل كلمة أو جملة للمنع..." 
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                      className="bg-muted border-border focus:ring-red-600 h-11"
                    />
                    <Button 
                      onClick={addKeyword}
                      disabled={saving || !newKeyword.trim()}
                      className="bg-red-600 hover:bg-red-700 h-11 px-6 text-white"
                    >
                      <Plus className="w-5 h-5 md:ml-2" />
                      <span className="hidden md:inline">إضافة الكلمة</span>
                    </Button>
                  </div>
                </Card>

                <div className="md:hidden relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="بحث في الكلمات..." 
                    className="bg-muted border-border pr-9 focus:ring-red-600"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="bg-muted/30 border border-border rounded-2xl p-6 min-h-[300px]">
                  <div className="flex flex-wrap gap-2">
                    {filteredKeywords.length === 0 ? (
                      <div className="w-full flex flex-col items-center justify-center py-10 opacity-30">
                        <Ban className="w-10 h-10 mb-2" />
                        <p className="text-sm">لا توجد كلمات محظورة</p>
                      </div>
                    ) : (
                      filteredKeywords.map((keyword) => (
                        <motion.div
                          layout
                          key={keyword}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                        >
                          <Badge 
                            className="bg-red-600/10 hover:bg-red-600/20 text-red-500 border-red-600/20 px-3 py-1.5 flex items-center gap-2 group transition-all"
                          >
                            <span className="font-medium">{keyword}</span>
                            <button 
                              onClick={() => removeKeyword(keyword)}
                              className="opacity-50 group-hover:opacity-100 hover:text-red-400"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </Badge>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </main>

      {/* PIN Dialog */}
      <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {pinAction === 'setup' ? 'إعداد رمز سري' : 
               pinAction === 'update' ? 'تحديث الرمز السري' : 'إزالة الرمز السري'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {pinAction === 'setup' ? 'أدخل رمزاً مكوناً من 4 أرقام' : 
               pinAction === 'update' ? 'أدخل الرمز الحالي ثم الجديد' : 'أدخل الرمز الحالي للتأكيد'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-6 py-4" dir="ltr">
            {(pinAction === 'update' || pinAction === 'remove') && (
              <div className="space-y-2 w-full flex flex-col items-center">
                <label className="text-xs font-bold text-muted-foreground" dir="rtl">الرمز الحالي</label>
                <InputOTP maxLength={4} value={pinInput} onChange={setPinInput}>
                  <InputOTPGroup className="gap-2">
                    <InputOTPSlot index={0} className="w-10 h-12 border-2" />
                    <InputOTPSlot index={1} className="w-10 h-12 border-2" />
                    <InputOTPSlot index={2} className="w-10 h-12 border-2" />
                    <InputOTPSlot index={3} className="w-10 h-12 border-2" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            )}
            
            {(pinAction === 'setup' || pinAction === 'update') && (
              <div className="space-y-2 w-full flex flex-col items-center">
                <label className="text-xs font-bold text-muted-foreground" dir="rtl">
                  {pinAction === 'setup' ? 'الرمز السري' : 'الرمز الجديد'}
                </label>
                <InputOTP maxLength={4} value={newPinInput} onChange={setNewPinInput} type="password">
                  <InputOTPGroup className="gap-2">
                    <InputOTPSlot index={0} className="w-10 h-12 border-2" />
                    <InputOTPSlot index={1} className="w-10 h-12 border-2" />
                    <InputOTPSlot index={2} className="w-10 h-12 border-2" />
                    <InputOTPSlot index={3} className="w-10 h-12 border-2" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            )}
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsPinDialogOpen(false)} className="hover:bg-muted">إلغاء</Button>
            <Button 
              onClick={handlePinAction} 
              disabled={saving || (pinAction === 'setup' && newPinInput.length < 4) || ((pinAction === 'update' || pinAction === 'remove') && pinInput.length < 4)}
              className="bg-red-600 hover:bg-red-700"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : "تأكيد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile Footer Stats */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border p-4 md:hidden z-50">
        <div className="flex items-center justify-around">
          <Link href="/" className="flex flex-col items-center gap-1 text-muted-foreground">
            <Home className="w-5 h-5" />
            <span className="text-[10px]">الرئيسية</span>
          </Link>
          <div className="h-8 w-[1px] bg-border" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-red-500">{whitelist.length}</span>
            <span className="text-[10px] text-muted-foreground">القائمة</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-green-500">{categories.filter(c => c.enabled).length}</span>
            <span className="text-[10px] text-muted-foreground">فئة</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-yellow-500">{blockedKeywords.length}</span>
            <span className="text-[10px] text-muted-foreground">كلمة</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
