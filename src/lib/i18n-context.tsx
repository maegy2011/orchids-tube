"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, LanguageCode, TranslationKeys } from './translations';

interface I18nContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  location: string;
  setLocation: (loc: string) => void;
  restrictedMode: boolean;
  setRestrictedMode: (mode: boolean) => void;
  showGregorianDate: boolean;
  setShowGregorianDate: (show: boolean) => void;
    showHijriDate: boolean;
    setShowHijriDate: (show: boolean) => void;
    showRamadanCountdown: boolean;
    setShowRamadanCountdown: (show: boolean) => void;
    hijriOffset: number;
    setHijriOffset: (offset: number) => void;
    loadMode: "auto" | "manual";
    setLoadMode: (mode: "auto" | "manual") => void;
    t: (key: TranslationKeys) => string;
    direction: "ltr" | "rtl";
  }


const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('ar');
  const [location, setLocationState] = useState<string>('مصر');
  const [restrictedMode, setRestrictedModeState] = useState<boolean>(false);
  const [showGregorianDate, setShowGregorianDateState] = useState<boolean>(true);
  const [showHijriDate, setShowHijriDateState] = useState<boolean>(true);
  const [showRamadanCountdown, setShowRamadanCountdownState] = useState<boolean>(true);
    const [hijriOffset, setHijriOffsetState] = useState<number>(0);
    const [loadMode, setLoadModeState] = useState<"auto" | "manual">("auto");

    useEffect(() => {

    const savedLanguage = localStorage.getItem('app-language-code') as LanguageCode;
    if (savedLanguage && translations[savedLanguage]) {
      setLanguageState(savedLanguage);
    }
    
    const savedLocation = localStorage.getItem('app-location');
    if (savedLocation) setLocationState(savedLocation);

    const savedRestricted = localStorage.getItem('app-restricted-mode');
    if (savedRestricted) setRestrictedModeState(savedRestricted === 'true');

    const savedShowGregorian = localStorage.getItem('app-show-gregorian');
    if (savedShowGregorian) setShowGregorianDateState(savedShowGregorian === 'true');

    const savedShowHijri = localStorage.getItem('app-show-hijri');
    if (savedShowHijri) setShowHijriDateState(savedShowHijri === 'true');

    const savedShowRamadan = localStorage.getItem('app-show-ramadan-countdown');
    if (savedShowRamadan) setShowRamadanCountdownState(savedShowRamadan === 'true');

      const savedHijriOffset = localStorage.getItem('app-hijri-offset');
      if (savedHijriOffset) setHijriOffsetState(parseInt(savedHijriOffset, 10));

      const savedLoadMode = localStorage.getItem('app-load-mode') as "auto" | "manual";
      if (savedLoadMode) setLoadModeState(savedLoadMode);
    }, []);


  useEffect(() => {
    // Update document attributes to reflect current language and direction
    document.documentElement.lang = language;
    document.documentElement.dir = translations[language].direction;
  }, [language]);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('app-language-code', lang);
  };

  const setLocation = (loc: string) => {
    setLocationState(loc);
    localStorage.setItem('app-location', loc);
  };

  const setRestrictedMode = (mode: boolean) => {
    setRestrictedModeState(mode);
    localStorage.setItem('app-restricted-mode', String(mode));
  };

  const setShowGregorianDate = (show: boolean) => {
    setShowGregorianDateState(show);
    localStorage.setItem('app-show-gregorian', String(show));
  };

  const setShowHijriDate = (show: boolean) => {
    setShowHijriDateState(show);
    localStorage.setItem('app-show-hijri', String(show));
  };

  const setShowRamadanCountdown = (show: boolean) => {
    setShowRamadanCountdownState(show);
    localStorage.setItem('app-show-ramadan-countdown', String(show));
  };

    const setHijriOffset = (offset: number) => {
      setHijriOffsetState(offset);
      localStorage.setItem('app-hijri-offset', String(offset));
    };

    const setLoadMode = (mode: "auto" | "manual") => {
      setLoadModeState(mode);
      localStorage.setItem('app-load-mode', mode);
    };

    const t = (key: TranslationKeys): string => {

    const translation = translations[language][key] || translations['en'][key];
    return translation || (key as string);
  };

  const direction = translations[language].direction as "ltr" | "rtl";

  return (
    <I18nContext.Provider value={{ 
      language, 
      setLanguage, 
      location, 
      setLocation, 
      restrictedMode, 
      setRestrictedMode,
      showGregorianDate,
      setShowGregorianDate,
        showHijriDate,
        setShowHijriDate,
        showRamadanCountdown,
        setShowRamadanCountdown,
          hijriOffset,
          setHijriOffset,
          loadMode,
          setLoadMode,
        t, 
        direction 
      }}>

      <div dir={direction} className="min-h-screen">
        {children}
      </div>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
