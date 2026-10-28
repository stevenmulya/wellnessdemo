"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Camera,
  Check,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";

interface WorkoutSectionProps {
  dayNumber: number;
  availableOptions: string[];
  selectedWorkout?: string | null;
  photoBeforeUrl?: string | null;
  photoAfterUrl?: string | null;
  workoutNotes?: string | null;
  checklist: string[];
  completedChecklist: string[];
  isPast2359: boolean;
  onSelectWorkout: (workout: string) => Promise<void>;
  onUploadPhoto: (type: "before" | "after", base64OrUrl: string) => Promise<void>;
  onToggleChecklistItem: (task: string) => Promise<void>;
  onSaveWorkoutNotes?: (notes: string) => Promise<void>;
  onUpdateChecklistRep?: (itemKey: string, reps: string) => Promise<void>;
}

export function WorkoutSection({
  dayNumber,
  availableOptions = [],
  selectedWorkout,
  photoBeforeUrl,
  photoAfterUrl,
  workoutNotes = "",
  checklist = [],
  completedChecklist = [],
  isPast2359,
  onSelectWorkout,
  onUploadPhoto,
  onToggleChecklistItem,
  onSaveWorkoutNotes,
  onUpdateChecklistRep,
}: WorkoutSectionProps) {
  const defaultOptions =
    availableOptions.length > 0
      ? availableOptions
      : [
          "Hot Pilates",
          "Strength Workout",
          "Outdoor Running",
          "Yoga & Mobility Flow",
          "Cardio / HIIT",
          "Custom Routine",
        ];

  const [activeWorkout, setActiveWorkout] = useState<string>(
    selectedWorkout || defaultOptions[0]
  );
  const [customInput, setCustomInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Workout Notes State
  const [trainingNotes, setTrainingNotes] = useState(workoutNotes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  // Local rep input state
  const [repInputs, setRepInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (workoutNotes !== undefined && workoutNotes !== null) {
      setTrainingNotes(workoutNotes);
    }
  }, [workoutNotes]);

  // Prepopulate repInputs from completedChecklist
  useEffect(() => {
    const map: Record<string, string> = {};
    for (const item of completedChecklist) {
      if (item.includes("=")) {
        const [k, v] = item.split("=").map((s) => s.trim());
        if (k && v) map[k] = v;
      }
    }
    setRepInputs((prev) => ({ ...map, ...prev }));
  }, [completedChecklist]);

  const handleWorkoutClick = async (option: string) => {
    if (isPast2359) return;
    if (option === "Custom Routine") {
      setShowCustomInput(true);
      return;
    }
    setActiveWorkout(option);
    setShowCustomInput(false);
    await onSelectWorkout(option);
  };

  const handleCustomSubmit = async () => {
    if (!customInput.trim() || isPast2359) return;
    setActiveWorkout(customInput.trim());
    await onSelectWorkout(customInput.trim());
    setShowCustomInput(false);
  };

  const handleFileChange = (type: "before" | "after", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        await onUploadPhoto(type, dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveNotes = async () => {
    if (!onSaveWorkoutNotes || isPast2359) return;
    setIsSavingNotes(true);
    setNotesSaved(false);
    try {
      await onSaveWorkoutNotes(trainingNotes);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 3000);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Helper to parse checklist item
  const parseItem = (task: string) => {
    if (task.includes("=")) {
      const [name, target] = task.split("=").map((s) => s.trim());
      return { isKeyValue: true, name, target };
    }
    return { isKeyValue: false, name: task.trim(), target: "" };
  };

  const isItemChecked = (task: string) => {
    const { isKeyValue, name } = parseItem(task);
    if (completedChecklist.includes(task)) return true;
    if (isKeyValue) {
      return completedChecklist.some((c) => {
        const cName = c.includes("=") ? c.split("=")[0].trim() : c.trim();
        return cName.toLowerCase() === name.toLowerCase();
      });
    }
    return false;
  };

  const handleRepChange = (name: string, val: string) => {
    setRepInputs((prev) => ({ ...prev, [name]: val }));
  };

  const handleRepBlur = async (task: string, name: string) => {
    const val = repInputs[name] || "";
    if (onUpdateChecklistRep) {
      await onUpdateChecklistRep(task, val);
    } else {
      // Fallback: save as "name = val" or original task
      const formatted = val.trim() ? `${name} = ${val.trim()}` : task;
      await onToggleChecklistItem(formatted);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. SELEKSI JENIS TRAINING */}
      <div className="glass-panel rounded-3xl p-7 sm:p-9 space-y-5 border border-zinc-200/70 dark:border-white/10 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-zinc-900/[0.06] dark:border-white/10 pb-5">
          <div className="space-y-1.5">
            <span className="text-micro text-zinc-500 dark:text-zinc-400 block tracking-[0.24em] uppercase font-mono">
              Discipline Selection
            </span>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white font-geometric">
              Today&apos;s Movement Discipline
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-light max-w-md leading-relaxed font-mono">
              Select the movement modality executed for Day {dayNumber}.
            </p>
          </div>

          {activeWorkout && (
            <div className="shrink-0">
              <span className="text-xs px-4 py-1.5 rounded-full font-mono font-medium border bg-white/10 border-white/20 text-white backdrop-blur-md">
                {activeWorkout}
              </span>
            </div>
          )}
        </div>

        {/* Workout Options Pill Selector */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {defaultOptions.map((opt) => {
            const isSelected = activeWorkout === opt;
            return (
              <button
                key={opt}
                type="button"
                disabled={isPast2359}
                onClick={() => handleWorkoutClick(opt)}
                className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all duration-200 ${
                  isSelected
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-md scale-[1.02]"
                    : "glass-panel-subtle text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white border border-zinc-200/60 dark:border-white/10"
                }`}
              >
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        {showCustomInput && (
          <div className="flex items-center gap-2 pt-2 max-w-sm">
            <input
              type="text"
              placeholder="Enter custom discipline..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="px-4 py-2 text-xs rounded-xl glass-input w-full"
            />
            <button
              type="button"
              onClick={handleCustomSubmit}
              className="px-5 py-2 rounded-xl chrome-button text-xs font-semibold shrink-0"
            >
              Save
            </button>
          </div>
        )}
      </div>

      {/* 2. DUAL UPLOAD FOTO BEFORE & AFTER */}
      <div className="glass-panel rounded-3xl p-7 sm:p-9 space-y-6 border border-zinc-200/70 dark:border-white/10 shadow-xl">
        <div className="space-y-1.5 border-b border-zinc-900/[0.06] dark:border-white/10 pb-5">
          <span className="text-micro text-zinc-400 dark:text-zinc-400 block tracking-[0.24em] uppercase font-mono">
            Visual Accountability
          </span>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white font-geometric">
            Before &amp; After Photo Reflection
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-light max-w-lg leading-relaxed font-mono">
            Document physical readiness before session and post-workout vitality.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {/* Slot 1: Foto Before */}
          <div className="rounded-3xl border border-zinc-200/70 dark:border-white/10 p-5 glass-panel-subtle space-y-4 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-zinc-200/50 dark:border-white/10 pb-3 font-mono">
              <div>
                <span className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider block">
                  01 • Before Session
                </span>
                <span className="text-[11px] text-zinc-400 font-light">Mat &amp; gear preparation</span>
              </div>
              {photoBeforeUrl && (
                <span className="text-[11px] text-zinc-900 dark:text-zinc-200 font-medium flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" /> Uploaded
                </span>
              )}
            </div>

            {/* Preview or Upload Placeholder */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-zinc-950/5 dark:bg-black/30 border border-zinc-200/80 dark:border-white/10 flex items-center justify-center group/photo">
              {photoBeforeUrl ? (
                <>
                  <Image
                    src={photoBeforeUrl}
                    alt="Before Workout"
                    fill
                    className="object-cover"
                  />
                  {!isPast2359 && (
                    <label className="absolute inset-0 bg-black/55 opacity-0 group-hover/photo:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-xs font-medium gap-2 backdrop-blur-sm font-mono">
                      <Camera className="w-5 h-5 text-zinc-300" />
                      <span>Replace Before Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange("before", e)}
                      />
                    </label>
                  )}
                </>
              ) : (
                <label className="flex flex-col items-center justify-center p-6 text-center cursor-pointer space-y-2.5 w-full h-full hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-200/50 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 flex items-center justify-center">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 font-mono">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-white block">
                      Upload Before Photo
                    </span>
                    <span className="text-[11px] text-zinc-400 font-light block">
                      Tap to capture or choose from library
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isPast2359}
                    className="hidden"
                    onChange={(e) => handleFileChange("before", e)}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Slot 2: Foto After */}
          <div className="rounded-3xl border border-zinc-200/70 dark:border-white/10 p-5 glass-panel-subtle space-y-4 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-zinc-200/50 dark:border-white/10 pb-3 font-mono">
              <div>
                <span className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider block">
                  02 • Post Workout
                </span>
                <span className="text-[11px] text-zinc-400 font-light">Sweat check &amp; vitality</span>
              </div>
              {photoAfterUrl && (
                <span className="text-[11px] text-zinc-900 dark:text-zinc-200 font-medium flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" /> Uploaded
                </span>
              )}
            </div>

            {/* Preview or Upload Placeholder */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-zinc-950/5 dark:bg-black/30 border border-zinc-200/80 dark:border-white/10 flex items-center justify-center group/photo">
              {photoAfterUrl ? (
                <>
                  <Image
                    src={photoAfterUrl}
                    alt="After Workout"
                    fill
                    className="object-cover"
                  />
                  {!isPast2359 && (
                    <label className="absolute inset-0 bg-black/55 opacity-0 group-hover/photo:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-xs font-medium gap-2 backdrop-blur-sm font-mono">
                      <Camera className="w-5 h-5 text-zinc-300" />
                      <span>Replace After Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange("after", e)}
                      />
                    </label>
                  )}
                </>
              ) : (
                <label className="flex flex-col items-center justify-center p-6 text-center cursor-pointer space-y-2.5 w-full h-full hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-200/50 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 font-mono">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-white block">
                      Upload After Photo
                    </span>
                    <span className="text-[11px] text-zinc-400 font-light block">
                      Capture post-session feeling
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isPast2359}
                    className="hidden"
                    onChange={(e) => handleFileChange("after", e)}
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. CHECKLIST AKTIVITAS LATIHAN DENGAN INPUT ANGKA / REPS */}
      {checklist.length > 0 && (
        <div className="glass-panel rounded-3xl p-7 sm:p-9 space-y-5 border border-zinc-200/70 dark:border-white/10 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900/[0.06] dark:border-white/10 pb-5">
            <div className="space-y-1">
              <span className="text-micro text-zinc-500 dark:text-zinc-400 block tracking-[0.24em] uppercase font-mono">
                Movement Targets &amp; Logging
              </span>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white font-geometric">
                Daily Protocol Checklist
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-light font-mono">
                Log your completed reps / sets for each movement below.
              </p>
            </div>

            <span className="text-xs font-mono font-medium text-zinc-600 dark:text-zinc-400 px-3.5 py-1.5 rounded-full glass-panel-subtle w-fit shrink-0">
              {completedChecklist.length} of {checklist.length} Completed
            </span>
          </div>

          <div className="space-y-3 font-mono">
            {checklist.map((task, idx) => {
              const { isKeyValue, name, target } = parseItem(task);
              const isChecked = isItemChecked(task);
              const currentVal = repInputs[name] !== undefined ? repInputs[name] : target;

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border text-xs sm:text-sm font-light transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isChecked
                      ? "glass-panel-subtle border-white/20 text-zinc-400 bg-white/5"
                      : "glass-panel-subtle border-zinc-200/60 dark:border-white/10 text-zinc-900 dark:text-zinc-100"
                  }`}
                >
                  {/* Left: Checkbox & Name */}
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <button
                      type="button"
                      disabled={isPast2359}
                      onClick={() => onToggleChecklistItem(task)}
                      className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition ${
                        isChecked
                          ? "bg-white text-zinc-950 border-white shadow-xs"
                          : "border-zinc-400 dark:border-zinc-600 hover:border-zinc-300"
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <span className={`block font-medium truncate ${isChecked ? "line-through opacity-70" : "text-zinc-900 dark:text-white"}`}>
                        {name}
                      </span>
                      {target && (
                        <span className="text-[11px] text-zinc-400 block font-light">
                          Target: {target}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Actual Input Log */}
                  <div className="flex items-center gap-2 pl-9 sm:pl-0 shrink-0">
                    <span className="text-micro text-zinc-400 uppercase tracking-wider hidden sm:inline">
                      Actual:
                    </span>
                    <input
                      type="text"
                      disabled={isPast2359}
                      value={currentVal}
                      onChange={(e) => handleRepChange(name, e.target.value)}
                      onBlur={() => handleRepBlur(task, name)}
                      placeholder={target || "e.g. 30 reps"}
                      className="w-28 sm:w-32 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. TODAY'S TRAINING NOTES & SENSATION */}
      <div className="glass-panel rounded-3xl p-7 sm:p-9 space-y-5 border border-zinc-200/70 dark:border-white/10 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-zinc-900/[0.06] dark:border-white/10 pb-5">
          <div className="space-y-1.5">
            <span className="text-micro text-zinc-500 dark:text-zinc-400 block tracking-[0.24em] uppercase font-mono">
              Session Feedback
            </span>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white font-geometric">
              Today&apos;s Training Notes
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-light max-w-md leading-relaxed font-mono">
              Record how your body felt, personal bests, form adjustments, or recovery observations.
            </p>
          </div>
        </div>

        <div className="space-y-3 font-mono">
          <textarea
            rows={3}
            value={trainingNotes}
            disabled={isPast2359}
            onChange={(e) => setTrainingNotes(e.target.value)}
            placeholder="e.g. Core felt strong, completed 35 clean push-ups without rest. Hip mobility was slightly tight during lunges..."
            className="w-full p-4 rounded-2xl glass-input text-xs sm:text-sm font-light text-zinc-900 dark:text-white leading-relaxed resize-none transition focus:ring-1 focus:ring-white/40 font-mono"
          />

          {!isPast2359 && onSaveWorkoutNotes && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="px-6 py-2.5 rounded-full chrome-button text-xs font-semibold tracking-wide flex items-center gap-2 transition duration-200 shadow-md font-mono"
              >
                {isSavingNotes ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : notesSaved ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-950" />
                    <span>Saved</span>
                  </>
                ) : (
                  <span>Save Training Notes</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
