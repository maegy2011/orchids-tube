"use client";

import dynamic from "next/dynamic";
import { KidsModeEffects } from "@/components/ui/kids-mode-effects";
import { EyeProtectionReminder } from "@/components/ui/eye-protection-reminder";

const RamadanCountdown = dynamic(() => import("@/components/sections/ramadan-countdown"), {
  ssr: false,
});

export function ClientLayout() {
  return (
    <>
      <KidsModeEffects />
      <RamadanCountdown />
      <EyeProtectionReminder />
    </>
  );
}
