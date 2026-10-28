"use client";

import { useState, useEffect } from "react";
import { Moon, Sunrise, Clock, Sparkles, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { calculateSleepDuration } from "@/wellness/utils/timezone";

interface SleepTrackerCardProps {
  dayNumber: number;
  sleepRecommendation: string | null;
  initialBedtime?: string | null;
  initialWakeTime?: string | null;
  initialSleepMinutes?: number | null;
  isPast2359: boolean;
  onSaveSleep: (bedtime: string, wakeTime: string, sleepDurationMinutes: number) => Promise<void>;
}

export function SleepTrackerCard({
  dayNumber,
  sleepRecommendation,
  initialBedtime = "",
  initialWakeTime = "",
  initialSleepMinutes,
  isPast2359,
  onSaveSleep,
}: SleepTrackerCardProps) {
  const [bedtime, setBedtime] = useState(initialBedtime || "22:30");
  const [wakeTime, setWakeTime] = useState(initialWakeTime || "06:30");
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (initialBedtime) setBedtime(initialBedtime);
    if (initialWakeTime) setWakeTime(initialWakeTime);
  }, [initialBedtime, initialWakeTime]);

  const sleepCalc = calculateSleepDuration(bedtime, wakeTime);

  const handleSave = async () => {
    if (!sleepCalc) return;
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await onSaveSleep(bedtime, wakeTime, sleepCalc.totalMinutes);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const isOptimal = sleepCalc ? sleepCalc.totalMinutes >= 420 : false;

  return (
    <div className="glass-panel rounded-3xl p-7 sm:p-9 space-y-6 relative overflow-hidden group border border-zinc-200/70 dark:border-white/10 shadow-xl">
      {/* Background Soft Ambient Aura */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header with High Negative Space */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-zinc-900/[0.06] dark:border-white/10 pb-5">
        <div className="space-y-1.5">
          <span className="text-micro text-zinc-500 dark:text-zinc-400 block tracking-[0.24em] uppercase font-mono">
            Phase 01 • Morning Awakening
          </span>
          <h3 className="text-xl sm:text-2xl font-light tracking-tight text-zinc-900 dark:text-white font-geometric">
            Circadian Sleep &amp; Rest Log
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-light max-w-md leading-relaxed font-mono">
            Record last night&apos;s rest and wake time to track your cellular circadian rhythm.
          </p>
        </div>

        {sleepCalc && (
          <div className="shrink-0 flex items-center font-mono">
            <span
              className={`text-xs px-4 py-1.5 rounded-full font-medium border flex items-center gap-2 backdrop-blur-md ${
                isOptimal
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-zinc-200/60 dark:bg-white/10 border-zinc-300 dark:border-white/10 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>{sleepCalc.formatted} Rest</span>
            </span>
          </div>
        )}
      </div>

      {/* Coach Sleep Recommendation */}
      {sleepRecommendation && (
        <div className="p-4 sm:p-5 rounded-2xl glass-panel-subtle border border-zinc-200/60 dark:border-white/10 text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-3 font-mono">
          <Sparkles className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-micro text-zinc-500 dark:text-zinc-400 block tracking-[0.2em] uppercase font-mono">
              Coach Circadian Recommendation
            </span>
            <span className="font-light leading-relaxed">{sleepRecommendation}</span>
          </div>
        </div>
      )}

      {/* Input Hours Grid with Elegant Frosted Inputs */}
      <div className="grid sm:grid-cols-2 gap-4 font-mono">
        <div className="space-y-2">
          <label className="text-micro uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Moon className="w-3.5 h-3.5 text-zinc-400" />
            <span>Bedtime Last Night</span>
          </label>
          <input
            type="time"
            value={bedtime}
            disabled={isPast2359}
            onChange={(e) => setBedtime(e.target.value)}
            className="w-full h-12 px-4 rounded-2xl glass-input text-xs sm:text-sm font-medium text-zinc-900 dark:text-white transition focus:ring-1 focus:ring-white/40 font-mono"
          />
        </div>

        <div className="space-y-2">
          <label className="text-micro uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Sunrise className="w-3.5 h-3.5 text-zinc-400" />
            <span>Wake Time This Morning</span>
          </label>
          <input
            type="time"
            value={wakeTime}
            disabled={isPast2359}
            onChange={(e) => setWakeTime(e.target.value)}
            className="w-full h-12 px-4 rounded-2xl glass-input text-xs sm:text-sm font-medium text-zinc-900 dark:text-white transition focus:ring-1 focus:ring-white/40 font-mono"
          />
        </div>
      </div>

      {/* Calculated Insight & Save Action */}
      <div className="pt-3 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-900/[0.06] dark:border-white/10 font-mono">
        <div className="text-xs text-zinc-500 dark:text-zinc-400 font-light">
          {sleepCalc ? (
            <span className="flex items-center gap-2">
              {isOptimal ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-zinc-300" />
                  <span>Optimal rest quality • {sleepCalc.formatted}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-zinc-400" />
                  <span>Below recommended 7 hours • {sleepCalc.formatted}</span>
                </>
              )}
            </span>
          ) : (
            <span>Set bedtime and wake time</span>
          )}
        </div>

        {!isPast2359 && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-full chrome-button text-xs font-semibold tracking-wide flex items-center gap-2 transition duration-200 shadow-md font-mono"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : savedSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-950 dark:text-zinc-950" />
                <span>Saved</span>
              </>
            ) : (
              <span>Save Sleep Log</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
