"use client";

import { useState, useRef, useEffect } from "react";
import Masthead from "@/components/sections/masthead";
import SidebarGuide from "@/components/sections/sidebar-guide";
import { Headphones, Send, User, Bot, CheckCircle2, Paperclip, Smile, HelpCircle, MessageSquarePlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import { getDaysUntilRamadan } from "@/lib/date-utils";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

export default function SupportPage() {
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t, showRamadanCountdown } = useI18n();
  const [daysUntilRamadan, setDaysUntilRamadan] = useState<number | null>(null);

  useEffect(() => {
    setDaysUntilRamadan(getDaysUntilRamadan());
  }, []);

  const isRamadanCountdownVisible = showRamadanCountdown && daysUntilRamadan !== null && daysUntilRamadan > 0;
  const mainPaddingTop = isRamadanCountdownVisible ? 'pt-[40px] sm:pt-[36px]' : 'pt-0';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    setMounted(true);
    setMessages([
      {
        id: '1',
        text: "مرحباً! كيف يمكننا مساعدتك اليوم؟ نحن هنا للرد على استفساراتك.",
        sender: 'agent',
        timestamp: new Date()
      }
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setMessage("");
    setIsTyping(true);

    setTimeout(() => {
      const responses = [
        "شكراً لتواصلك معنا. جاري تحويلك لأحد ممثلي خدمة العملاء.",
        "فهمت المشكلة. هل يمكنك تزويدي بمزيد من التفاصيل؟",
        "نحن نعمل على حل هذا الأمر حالياً. شكراً لصبرك.",
        "بالتأكيد، يمكنني مساعدتك في ذلك. ما هو رقم الحساب الخاص بك؟"
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        sender: 'agent',
        timestamp: new Date()
      };
      
      setIsTyping(false);
      setMessages(prev => [...prev, agentResponse]);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <Masthead 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
      />
      <SidebarGuide isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className={`flex-1 ${language === 'ar' ? 'mr-0 lg:mr-[240px]' : 'ml-0 lg:ml-[240px]'} pt-[64px] flex flex-col h-[calc(100vh-64px)] overflow-hidden transition-all duration-300`}>
        <div className={`flex-1 max-w-4xl w-full mx-auto flex flex-col bg-card shadow-xl lg:my-6 lg:rounded-3xl overflow-hidden border border-border ${mainPaddingTop}`}>
          <div className="bg-red-600 p-4 text-white flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                  <Headphones className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">{t('support')}</h1>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs opacity-80 font-medium text-white">متصل الآن</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 bg-black/10 p-1 rounded-xl">
              <Link 
                href="/help"
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                {t('help')}
              </Link>
              <Link 
                href="/feedback"
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
              >
                <MessageSquarePlus className="w-4 h-4" />
                {t('feedback')}
              </Link>
              <div className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold bg-white text-red-600">
                <Headphones className="w-4 h-4" />
                {t('support')}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 no-scrollbar bg-muted/20">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'} items-end gap-2`}
                >
                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-red-600/10 flex items-center justify-center text-red-600 flex-shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                  
                  <div className={`
                    max-w-[80%] p-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed
                    ${msg.sender === 'user' 
                      ? 'bg-red-600 text-white rounded-br-none' 
                      : 'bg-muted text-foreground rounded-bl-none border border-border'}
                  `}>
                    {msg.text}
                    <div className={`text-[10px] mt-1 opacity-60 ${msg.sender === 'user' ? 'text-left text-white' : 'text-right text-muted-foreground'}`}>
                      {mounted && msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {msg.sender === 'agent' && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
                      <Bot className="w-5 h-5" />
                    </div>
                  )}
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-end items-center gap-2"
                >
                  <div className="bg-muted p-4 rounded-2xl border border-border rounded-bl-none shadow-sm flex gap-1">
                    <span className="w-1.5 h-1.5 bg-muted-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <Bot className="w-5 h-5" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 bg-card border-t border-border">
            <div className="flex items-center gap-2 bg-muted p-2 rounded-2xl focus-within:ring-2 ring-red-500/20 transition-all border border-border">
              <button type="button" className="p-2 text-muted-foreground hover:text-red-600 transition-colors">
                <Paperclip className="w-5 h-5" />
              </button>
              <button type="button" className="p-2 text-muted-foreground hover:text-red-600 transition-colors">
                <Smile className="w-5 h-5" />
              </button>
              <input 
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="اكتب رسالتك هنا..."
                className="flex-1 bg-transparent border-none focus:ring-0 outline-none p-2 text-foreground placeholder:text-muted-foreground"
              />
              <button 
                type="submit"
                disabled={!message.trim()}
                className={`
                  p-3 rounded-xl transition-all
                  ${!message.trim() ? 'bg-muted-foreground/30 text-muted-foreground cursor-not-allowed' : 'bg-red-600 text-white shadow-lg shadow-red-600/30 hover:bg-red-700 active:scale-95'}
                `}
              >
                <Send className="w-5 h-5 rotate-180" />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
