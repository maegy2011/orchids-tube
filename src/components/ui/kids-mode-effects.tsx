"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useScroll } from 'framer-motion';
import { 
  Gamepad2, Heart, Star, Sparkles, Rocket, Ghost, Gift, 
  Cloud, Moon, Sun, Rainbow, Wand2, Music, Zap, 
  Crown, Gem, Diamond, Smile, Laugh, PartyPopper
} from 'lucide-react';

const BOYS_ICONS = [Gamepad2, Rocket, Ghost, Star, Moon, Sun, Wand2, Zap, Crown, Smile];
const GIRLS_ICONS = [Heart, Sparkles, Gift, Star, Cloud, Sun, Rainbow, Gem, Diamond, Laugh];

interface ParticleData {
  id: number;
  x: number;
  y: number;
  size: number;
  Icon: any;
  color: string;
  duration: number;
  delay: number;
  rotation: number;
  parallaxFactor: number;
}

interface ClickBurst {
  id: number;
  x: number;
  y: number;
  icons: any[];
}

export function KidsModeEffects() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [bursts, setBursts] = useState<ClickBurst[]>([]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });
  
  const { scrollY } = useScroll();

  const isBoys = theme === 'boys';
  const isGirls = theme === 'girls';
  const isActive = isBoys || isGirls;

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleClick = (e: MouseEvent) => {
      if (!isActive) return;
      
      const icons = isBoys ? BOYS_ICONS : GIRLS_ICONS;
      const newBurst = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY,
        icons: Array.from({ length: 6 }).map(() => icons[Math.floor(Math.random() * icons.length)])
      };

      setBursts(prev => [...prev.slice(-5), newBurst]);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
    };
  }, [isActive, isBoys, mouseX, mouseY]);

  const particles = useMemo(() => {
    if (!isActive) return [];
    const icons = isBoys ? BOYS_ICONS : GIRLS_ICONS;
    const colors = isBoys 
      ? ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#0284c7'] 
      : ['#f472b6', '#fb7185', '#fda4af', '#fecdd3', '#db2777'];

    return Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 20 + 15,
      Icon: icons[Math.floor(Math.random() * icons.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: Math.random() * 10 + 15,
      delay: Math.random() * 5,
      rotation: Math.random() * 360,
      parallaxFactor: Math.random() * 0.5 + 0.2,
    }));
  }, [isActive, isBoys]);

  const blobs = useMemo(() => {
    if (!isActive) return [];
    const colors = isBoys 
      ? ['#e0f2fe', '#bae6fd', '#7dd3fc'] 
      : ['#ffe4e6', '#fecdd3', '#f9a8d4'];

    return Array.from({ length: 5 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 400 + 400,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: Math.random() * 20 + 20,
    }));
  }, [isActive, isBoys]);

  if (!mounted || !isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[9999]">
      {/* Background Blobs */}
      <div className="fixed inset-0 opacity-25 blur-[120px] z-[-1]">
        {blobs.map((blob) => (
          <motion.div
            key={blob.id}
            animate={{
              x: [`${blob.x}%`, `${(blob.x + 20) % 100}%`, `${blob.x}%`],
              y: [`${blob.y}%`, `${(blob.y - 20) % 100}%`, `${blob.y}%`],
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: blob.duration,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute rounded-full"
            style={{
              width: blob.size,
              height: blob.size,
              left: `${blob.x}%`,
              top: `${blob.y}%`,
              backgroundColor: blob.color,
            }}
          />
        ))}
      </div>

      {/* Interactive Particles */}
      <div className="fixed inset-0 z-[-1]">
        {particles.map((p) => (
          <Particle 
            key={p.id} 
            data={p} 
            mouseX={mouseX} 
            mouseY={mouseY} 
            scrollY={scrollY}
          />
        ))}
      </div>

      {/* Cursor Glow */}
      <motion.div
        className="fixed w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 z-[-1]"
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
          background: isBoys 
            ? 'radial-gradient(circle, #0ea5e9 0%, transparent 70%)' 
            : 'radial-gradient(circle, #f472b6 0%, transparent 70%)',
        }}
      />

      {/* Click Bursts */}
      <AnimatePresence>
        {bursts.map((burst) => (
          <div key={burst.id} className="fixed inset-0 overflow-visible">
            {burst.icons.map((Icon, i) => (
              <motion.div
                key={i}
                initial={{ x: burst.x, y: burst.y, scale: 0, opacity: 1, rotate: 0 }}
                animate={{ 
                  x: burst.x + (Math.random() - 0.5) * 300, 
                  y: burst.y + (Math.random() - 0.5) * 300,
                  scale: Math.random() * 2 + 0.5,
                  opacity: 0,
                  rotate: Math.random() * 720 - 360
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute"
                style={{ 
                  color: isBoys ? '#0ea5e9' : '#f472b6',
                }}
              >
                <Icon size={32} strokeWidth={1.5} className="drop-shadow-2xl" />
              </motion.div>
            ))}
          </div>
        ))}
      </AnimatePresence>

      <CursorTrail isBoys={isBoys} mouseX={mouseX} mouseY={mouseY} />
    </div>
  );
}

function Particle({ data, mouseX, mouseY, scrollY }: { 
  data: ParticleData, 
  mouseX: any, 
  mouseY: any, 
  scrollY: any 
}) {
  const x = useMotionValue(data.x);
  const y = useMotionValue(data.y);
  
  const springConfig = { stiffness: 50, damping: 20 };
  const tx = useSpring(useTransform(mouseX, (val) => (val - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)) * data.parallaxFactor * 0.1), springConfig);
  const ty = useSpring(useTransform(mouseY, (val) => (val - (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)) * data.parallaxFactor * 0.1), springConfig);
  const sy = useTransform(scrollY, (val) => val * data.parallaxFactor * -0.5);
  const combinedY = useTransform([ty, sy], ([v1, v2]: any) => v1 + v2);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: [0, 0.4, 0.2, 0.4, 0],
        scale: [0.8, 1.2, 1, 1.2, 0.8],
        rotate: [data.rotation, data.rotation + 360],
      }}
      transition={{
        duration: data.duration,
        repeat: Infinity,
        ease: "linear",
        delay: data.delay,
      }}
      className="absolute"
      style={{ 
        color: data.color,
        left: `${data.x}vw`,
        top: `${data.y}vh`,
        x: tx,
        y: combinedY,
      }}
    >
      <data.Icon strokeWidth={1} size={data.size} className="drop-shadow-lg filter blur-[0.5px]" />
    </motion.div>
  );
}

function CursorTrail({ isBoys, mouseX, mouseY }: { isBoys: boolean, mouseX: any, mouseY: any }) {
  const [trail, setTrail] = useState<{ id: number; x: number; y: number }[]>([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTrail(prev => [
        ...prev.slice(-12),
        { id: Math.random(), x: mouseX.get(), y: mouseY.get() }
      ]);
    }, 40);
    return () => clearInterval(interval);
  }, [mouseX, mouseY]);

  return (
    <>
      <AnimatePresence>
        {trail.map((point, i) => (
          <motion.div
            key={point.id}
            initial={{ opacity: 0.6, scale: 0.5, rotate: 0 }}
            animate={{ opacity: 0, scale: 0, rotate: 180 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed pointer-events-none z-[10000]"
            style={{
              left: point.x,
              top: point.y,
              translateX: "-50%",
              translateY: "-50%",
              color: isBoys ? '#38bdf8' : '#fb7185',
            }}
          >
            {isBoys ? <Star size={8 + i * 2} fill="currentColor" /> : <Heart size={8 + i * 2} fill="currentColor" />}
          </motion.div>
        ))}
      </AnimatePresence>
    </>
  );
}
