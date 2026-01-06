"use client";

import { useState, useEffect } from "react";
import Masthead from "@/components/sections/masthead";
import SidebarGuide from "@/components/sections/sidebar-guide";
import { Search, ChevronLeft, Play, User, Shield, CreditCard, MessageCircle, Headphones, MessageSquarePlus, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import { getDaysUntilRamadan } from "@/lib/date-utils";

export default function HelpPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { t, direction, showRamadanCountdown } = useI18n();
  const [daysUntilRamadan, setDaysUntilRamadan] = useState<number | null>(null);

  useEffect(() => {
    setDaysUntilRamadan(getDaysUntilRamadan());
  }, []);

  const isRamadanCountdownVisible = showRamadanCountdown && daysUntilRamadan !== null && daysUntilRamadan > 0;
  const mainPaddingTop = isRamadanCountdownVisible ? 'pt-[104px] sm:pt-[100px]' : 'pt-[64px]';

  const topics = [
    { icon: Play, title: "مشاهدة الفيديوهات", desc: "إصلاح مشاكل التشغيل والجودة" },
    { icon: User, title: "إدارة الحساب", desc: "تغيير كلمة المرور وتحديث البيانات" },
    { icon: Shield, title: "الخصوصية والأمان", desc: "حماية حسابك وإدارة بياناتك" },
    { icon: CreditCard, title: "الاشتراكات والمدفوعات", desc: "إدارة الفواتير والاشتراكات المميزة" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <Masthead 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
      />
      <SidebarGuide isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
        <main className={`mr-0 lg:mr-[240px] ${mainPaddingTop} transition-all duration-300`}>
          {/* Header Navigation */}
          <div className="bg-red-600 p-4 text-white">
            <div className="max-w-4xl mx-auto flex gap-2 bg-black/10 p-1 rounded-xl">
              <div className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold bg-white text-red-600">
                <HelpCircle className="w-4 h-4" />
                {t('help')}
              </div>
              <Link 
                href="/feedback"
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
              >
                <MessageSquarePlus className="w-4 h-4" />
                {t('feedback')}
              </Link>
              <Link 
                href="/support"
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
              >
                <Headphones className="w-4 h-4" />
                {t('support')}
              </Link>
            </div>
          </div>

          {/* Hero Section */}
        <div className="bg-muted py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-8">بماذا يمكننا مساعدتك؟</h1>
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input 
                type="text"
                placeholder="ابحث عن حل لمشكلتك..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-4 pr-12 pl-4 rounded-2xl border-none shadow-xl bg-background focus:ring-2 focus:ring-red-500 outline-none transition-all text-lg"
              />
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto p-8">
          <h2 className="text-xl font-bold mb-6">المواضيع الشائعة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topics.map((topic, i) => (
              <button 
                key={i}
                className="flex items-center justify-between p-6 bg-card border border-border rounded-2xl hover:bg-muted hover:border-red-500/30 transition-all group text-right"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-500/10 rounded-xl group-hover:bg-red-500/20 transition-colors">
                    <topic.icon className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{topic.title}</h3>
                    <p className="text-sm text-muted-foreground">{topic.desc}</p>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-red-600 transition-colors" />
              </button>
            ))}
          </div>

          <div className="mt-16 bg-red-600 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-2 text-white">لم تجد ما تبحث عنه؟</h2>
              <p className="opacity-90">فريق الدعم الفني متاح على مدار الساعة لمساعدتك في حل أي مشكلة تواجهك.</p>
            </div>
            <Link href="/support" className="whitespace-nowrap bg-white text-red-600 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              تحدث مع الدعم الفني
            </Link>
          </div>

          <div className="mt-16 text-center border-t border-border pt-12">
            <p className="text-muted-foreground text-sm">© 2024 يوتيوب. جميع الحقوق محفوظة لمركز المساعدة.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
