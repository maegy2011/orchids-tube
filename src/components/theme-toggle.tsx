"use client"

import * as React from "react"
import { Moon, Sun, Monitor, Check, Gamepad2, Heart } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

import { useI18n } from "@/lib/i18n-context"

interface ThemeToggleProps {
  showSpecialModes?: boolean;
  variant?: 'cycle' | 'dropdown';
}

export function ThemeToggle({ showSpecialModes, variant = 'dropdown' }: ThemeToggleProps) {
  const { setTheme, theme } = useTheme()
  const { t } = useI18n()
  const [mounted, setMounted] = React.useState(false)

  // Backward compatibility for showSpecialModes
  const finalVariant = showSpecialModes === false ? 'cycle' : variant;

  React.useEffect(() => {
    setMounted(true)
  }, [])

    const handleSetTheme = (newTheme: string) => {
      // Force instant switch by disabling all transitions
      document.documentElement.classList.add('no-transitions')

      setTheme(newTheme)
      
      // Toast for feedback (localized)
      let themeLabel = "";
      switch(newTheme) {
        case 'light': themeLabel = t('themeLight'); break;
        case 'dark': themeLabel = t('themeDark'); break;
        case 'system': themeLabel = t('themeSystem'); break;
        case 'boys': themeLabel = t('themeBoys'); break;
        case 'girls': themeLabel = t('themeKids' as any) || t('themeGirls'); break;
        default: themeLabel = t('themeSystem');
      }

      toast.success(`${t('appearance')}: ${themeLabel}`, {
        duration: 1000,
        position: 'bottom-center'
      })

      // Remove the class after a short delay
      setTimeout(() => {
        document.documentElement.classList.remove('no-transitions')
      }, 50)
    }

    const cycleTheme = (e: React.MouseEvent) => {
      if (finalVariant === 'dropdown') return;
      
      e.preventDefault();
      e.stopPropagation();

      // Cycle order: Light -> Dark -> System (Auto)
      const themes = ['light', 'dark', 'system'];
      
      // If current theme is not in the cycle (e.g., boys/girls), start from light
      const currentIndex = themes.indexOf(theme || 'system');
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % themes.length;
      
      handleSetTheme(themes[nextIndex]);
    }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="rounded-full">
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    )
  }

    const themeKidsLabel = t('themeKids' as any) || t('themeGirls');
    const currentThemeLabel = theme === "light" ? t('themeLight') : theme === "dark" ? t('themeDark') : theme === "boys" ? t('themeBoys') : theme === "girls" ? themeKidsLabel : t('themeSystem')

    const ToggleButton = (
      <Button 
        variant="ghost" 
        size="icon" 
        className="rounded-full relative hover:bg-muted transition-colors active:scale-90"
        title={`${t('appearance')}: ${currentThemeLabel}`}
        onClick={cycleTheme}
      >
        {theme === "light" && <Sun className="h-[1.2rem] w-[1.2rem] text-orange-500 animate-in fade-in zoom-in duration-300" />}
        {theme === "dark" && <Moon className="h-[1.2rem] w-[1.2rem] text-blue-400 animate-in fade-in zoom-in duration-300" />}
        {theme === "boys" && <Gamepad2 className="h-[1.2rem] w-[1.2rem] text-blue-500 animate-in fade-in zoom-in duration-300" />}
        {theme === "girls" && <Heart className="h-[1.2rem] w-[1.2rem] text-pink-500 animate-in fade-in zoom-in duration-300" />}
        {(theme === "system" || !theme) && <Monitor className="h-[1.2rem] w-[1.2rem] text-muted-foreground animate-in fade-in zoom-in duration-300" />}
        <span className="sr-only">{t('appearance')} ({currentThemeLabel})</span>
      </Button>
    );

    if (finalVariant === 'cycle') {
      return ToggleButton;
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {ToggleButton}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem 
            onClick={() => handleSetTheme("light")}
            className={cn("flex items-center justify-between cursor-pointer", theme === "light" && "bg-muted font-medium")}
          >
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-orange-500" />
              <span>{t('themeLight')}</span>
            </div>
            {theme === "light" && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleSetTheme("dark")}
            className={cn("flex items-center justify-between cursor-pointer", theme === "dark" && "bg-muted font-medium")}
          >
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-blue-400" />
              <span>{t('themeDark')}</span>
            </div>
            {theme === "dark" && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleSetTheme("boys")}
            className={cn("flex items-center justify-between cursor-pointer", theme === "boys" && "bg-muted font-medium")}
          >
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-blue-500" />
              <span>{t('themeBoys')}</span>
            </div>
            {theme === "boys" && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleSetTheme("girls")}
            className={cn("flex items-center justify-between cursor-pointer", theme === "girls" && "bg-muted font-medium")}
          >
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-500" />
              <span>{themeKidsLabel}</span>
            </div>
            {theme === "girls" && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleSetTheme("system")}
            className={cn("flex items-center justify-between cursor-pointer", (theme === "system" || !theme) && "bg-muted font-medium")}
          >
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <span>{t('themeSystem')}</span>
            </div>
            {(theme === "system" || !theme) && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
}
