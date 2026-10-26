"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  wellnessAdminSaveProgramDay,
  wellnessAdminDeleteProgramDay,
  wellnessAdminTogglePublishProgram,
  wellnessAdminUpdateProgramMeta,
  wellnessAdminDeleteProgram,
  wellnessAdminCreateProgram,
} from "@/wellness/actions/program";
import {
  wellnessAdminApprovePayment,
  wellnessAdminUpdateUserStatus,
  wellnessAdminResetUserPassword,
  wellnessAdminUpdateUserRole,
  wellnessAdminDeleteUser,
} from "@/wellness/actions/admin";
import { wellnessSignOut } from "@/wellness/actions/auth";
import { normalizeVideoEmbed } from "@/wellness/integrations/video-provider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import {
  Users,
  QrCode,
  Plus,
  CheckCircle2,
  LogOut,
  ArrowUpRight,
  Loader2,
  Save,
  Trash2,
  Video,
  Utensils,
  MapPin,
  Dumbbell,
  Coffee,
  AlertCircle,
  Globe,
  FileEdit,
  ArrowRight,
  ArrowLeft,
  Check,
  Search,
  Layers,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  KeyRound,
  Ban,
  LayoutDashboard,
  TrendingUp,
  Sparkles,
  CreditCard,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  X,
  UserCheck,
  Tag,
} from "lucide-react";

export interface AdminProgramDay {
  id: string;
  dayNumber: number;
  title: string;
  dayType: string;
  videoUrl: string | null;
  videoChecklist: string[];
  mealRecommendation: string | null;
  dailyAssessment: string | null;
  pendingReminder: string | null;
  completedReminder: string | null;
  meetupLink: string | null;
  onsiteVenue: string | null;
  onsiteSchedule: string | null;
  restInstructions: string | null;
  coachName?: string | null;
  recommendedFor?: string | null;
}

export interface AdminProgram {
  id: string;
  title: string;
  slug: string;
  description: string;
  recommendedFor: string;
  coachName: string;
  durationDays: number;
  price: number;
  maxQuota: number;
  communityLink: string | null;
  locationType?: string | null;
  city?: string | null;
  venueAddress?: string | null;
  virtualFallbackAvailable?: boolean | null;
  startDate: Date | string;
  endDate: Date | string;
  registrationDeadline: Date | string;
  isPublished: boolean;
  dayCount: number;
  activeSubscribers: number;
  pendingSubscribers: number;
  days: AdminProgramDay[];
}

export interface AdminUserItem {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  status: string;
  createdAt: Date | string;
  enrollments: {
    id: string;
    status: string;
    paymentReference: string | null;
    paidAt: Date | string | null;
    validUntil: Date | string | null;
    program: {
      id: string;
      title: string;
      price: number;
      _count: { days: number };
    };
  }[];
  dayProgress?: {
    id: string;
    videoWatched: boolean;
    isCompleted: boolean;
    checklistCompleted: string | null;
    assessmentResponse: string | null;
    completedAt: Date | string | null;
    programDay: {
      dayNumber: number;
      title: string;
      programId: string;
    };
  }[];
}

interface AdminClientProps {
  initialUsers: AdminUserItem[];
  initialPrograms: AdminProgram[];
  currentAdminId: string;
}

function isDayFilled(day: AdminProgramDay | undefined): boolean {
  if (!day || !day.title || day.title.trim().length < 2) return false;
  if (day.dayType === "TRAINING_DAY") {
    const hasVideo = Boolean(day.videoUrl && day.videoUrl.trim().length > 0);
    const hasTasks =
      Array.isArray(day.videoChecklist) && day.videoChecklist.length > 0;
    return hasVideo || hasTasks;
  }
  if (day.dayType === "REST_DAY") {
    return Boolean(day.restInstructions && day.restInstructions.trim().length > 0);
  }
  if (day.dayType === "MEETUP_DAY") {
    return Boolean(
      (day.onsiteVenue && day.onsiteVenue.trim().length > 0) ||
        (day.onsiteSchedule && day.onsiteSchedule.trim().length > 0)
    );
  }
  return false;
}

function toInputDate(d: Date | string): string {
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return new Date().toISOString().split("T")[0];
  return parsed.toISOString().split("T")[0];
}

function computeEndDate(startIso: string, durationDays: number): string {
  const start = new Date(startIso);
  if (isNaN(start.getTime())) return startIso;
  const end = new Date(
    start.getTime() + Math.max(0, durationDays - 1) * 24 * 3600 * 1000
  );
  return end.toISOString().split("T")[0];
}

function PaginationBar({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = "items",
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}) {
  if (totalItems === 0 || totalPages <= 1) return null;
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  return (
    <div className="px-7 py-4 border-t border-zinc-900/[0.06] dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
        Showing <strong className="text-zinc-900 dark:text-white">{startItem}</strong> –{" "}
        <strong className="text-zinc-900 dark:text-white">{endItem}</strong> of{" "}
        <strong className="text-zinc-900 dark:text-white">{totalItems}</strong> {itemLabel}
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="px-3 py-1.5 rounded-xl glass-panel-subtle text-[11px] font-medium text-zinc-700 dark:text-zinc-300 disabled:opacity-35 flex items-center gap-1 whitespace-nowrap transition"
        >
          <ChevronLeft className="w-3 h-3 shrink-0" /> Prev
        </button>

        <span className="px-2.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
          {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="px-3 py-1.5 rounded-xl glass-panel-subtle text-[11px] font-medium text-zinc-700 dark:text-zinc-300 disabled:opacity-35 flex items-center gap-1 whitespace-nowrap transition"
        >
          Next <ChevronRight className="w-3 h-3 shrink-0" />
        </button>
      </div>
    </div>
  );
}

function parseTagList(val: string | null | undefined): string[] {
  if (!val) return [];
  return val
    .split(/[,•\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function stringifyTagList(list: string[]): string {
  return list.filter(Boolean).join(", ");
}

interface MultiTagInputProps {
  label: string;
  subLabel?: string;
  value: string;
  onChange: (newValue: string) => void;
  placeholder: string;
  disabled?: boolean;
  quickSuggestions?: string[];
  icon?: React.ComponentType<{ className?: string }>;
  chipColor?: "orange" | "zinc";
}

function MultiTagInput({
  label,
  subLabel,
  value,
  onChange,
  placeholder,
  disabled = false,
  quickSuggestions = [],
  icon: Icon,
  chipColor = "zinc",
}: MultiTagInputProps) {
  const [draft, setDraft] = useState("");
  const tags = parseTagList(value);

  const addTag = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      const next = [...tags, trimmed];
      onChange(stringifyTagList(next));
    }
    setDraft("");
  };

  const removeTag = (indexToRemove: number) => {
    if (disabled) return;
    const next = tags.filter((_, idx) => idx !== indexToRemove);
    onChange(stringifyTagList(next));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />}
          <span>{label}</span>
          <span className="text-[10px] text-zinc-400 font-normal">
            ({tags.length} added)
          </span>
        </label>
        {subLabel && <span className="text-[10px] text-zinc-400">{subLabel}</span>}
      </div>

      <div
        className={`min-h-[42px] p-2 rounded-2xl glass-input flex flex-wrap items-center gap-1.5 ${
          disabled ? "opacity-60 cursor-not-allowed" : ""
        }`}
      >
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border animate-in fade-in zoom-in-95 duration-150 ${
              chipColor === "orange"
                ? "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/25"
                : "bg-zinc-900/10 dark:bg-white/10 text-zinc-900 dark:text-white border-zinc-900/[0.08] dark:border-white/10"
            }`}
          >
            <span>{tag}</span>
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(idx)}
                className="hover:opacity-70 rounded-full p-0.5 transition"
                title={`Remove ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}

        {!disabled && (
          <div className="flex-1 min-w-[150px] flex items-center gap-1.5">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={tags.length === 0 ? placeholder : "+ Add another (press Enter)..."}
              className="w-full bg-transparent border-none outline-none text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 px-1 py-1"
            />
            {draft.trim() && (
              <button
                type="button"
                onClick={() => addTag(draft)}
                className="px-2.5 py-1 rounded-lg chrome-button text-[10px] font-semibold shrink-0"
              >
                + Add
              </button>
            )}
          </div>
        )}
      </div>

      {!disabled && quickSuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] text-zinc-400">Quick suggestions:</span>
          {quickSuggestions
            .filter((s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase()))
            .map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => addTag(s)}
                className="text-[10px] px-2 py-0.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition"
              >
                + {s}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

export function AdminClient({
  initialUsers,
  initialPrograms,
  currentAdminId,
}: AdminClientProps) {
  const router = useRouter();

  const [activeMenu, setActiveMenu] = useState<
    "dashboard" | "programs" | "members" | "payments"
  >("dashboard");

  const [users, setUsers] = useState<AdminUserItem[]>(initialUsers);
  const [programs, setPrograms] = useState<AdminProgram[]>(initialPrograms);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [isCreatingProgram, setIsCreatingProgram] = useState(false);

  const defaultStart = new Date(Date.now() + 3 * 24 * 3600 * 1000)
    .toISOString()
    .split("T")[0];
  const defaultDeadline = new Date(Date.now() + 2 * 24 * 3600 * 1000)
    .toISOString()
    .split("T")[0];

  const [createForm, setCreateForm] = useState({
    title: "",
    coachName: "Coach Marcus Vance",
    recommendedFor: "All Levels • Mindful Movement & Longevity",
    description: "",
    durationDays: 21,
    price: 299000,
    maxQuota: 35,
    communityLink: "https://chat.whatsapp.com/wellness-cohort-group",
    locationType: "ONLINE" as "ONLINE" | "ONSITE" | "HYBRID",
    city: "",
    venueAddress: "",
    virtualFallbackAvailable: true,
    startDate: defaultStart,
    endDate: computeEndDate(defaultStart, 21),
    registrationDeadline: defaultDeadline,
  });
  const [creatingLoading, setCreatingLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);

  const [programSearch, setProgramSearch] = useState("");
  const [programFilter, setProgramFilter] = useState<"ALL" | "LIVE" | "DRAFT">("ALL");
  const [programPage, setProgramPage] = useState(1);
  const PROGRAM_PAGE_SIZE = 4;

  const [memberSearch, setMemberSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState<"ALL" | "ACTIVE" | "PENDING">("ALL");
  const [memberPage, setMemberPage] = useState(1);
  const MEMBER_PAGE_SIZE = 6;

  const [qrisSearch, setQrisSearch] = useState("");
  const [qrisPage, setQrisPage] = useState(1);
  const QRIS_PAGE_SIZE = 5;

  const [selectedDayNum, setSelectedDayNum] = useState<number>(1);
  const [dayBatchPage, setDayBatchPage] = useState<number>(1);
  const DAY_BATCH_SIZE = 15;

  const [programDetailTab, setProgramDetailTab] = useState<"info" | "schedule">("schedule");
  const [publishModal, setPublishModal] = useState<{
    isOpen: boolean;
    mode: "ERROR" | "CONFIRM";
    missingDays?: number[];
    errorList?: string[];
  } | null>(null);

  const [savingDay, setSavingDay] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [deletingProgId, setDeletingProgId] = useState<string | null>(null);
  const [userActionLoading, setUserActionLoading] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const selectedProgram = programs.find((p) => p.id === selectedProgramId) || null;
  const currentAdmin = users.find((u) => u.id === currentAdminId);

  const [metaForm, setMetaForm] = useState({
    title: "",
    coachName: "",
    recommendedFor: "",
    description: "",
    durationDays: 21,
    price: 299000,
    maxQuota: 35,
    communityLink: "",
    locationType: "ONLINE" as "ONLINE" | "ONSITE" | "HYBRID",
    city: "",
    venueAddress: "",
    virtualFallbackAvailable: true,
    startDate: "",
    endDate: "",
    registrationDeadline: "",
  });

  const [dayForm, setDayForm] = useState<{
    title: string;
    dayType: "TRAINING_DAY" | "REST_DAY" | "MEETUP_DAY";
    coachName: string;
    recommendedFor: string;
    videoUrl: string;
    videoChecklist: string[];
    mealRecommendation: string;
    dailyAssessment: string;
    restInstructions: string;
    onsiteVenue: string;
    onsiteSchedule: string;
    meetupLink: string;
    pendingReminder: string;
    completedReminder: string;
  }>({
    title: "",
    dayType: "TRAINING_DAY",
    coachName: "",
    recommendedFor: "",
    videoUrl: "",
    videoChecklist: ["Complete today's workout", "Follow the meal guide"],
    mealRecommendation: "",
    dailyAssessment: "",
    restInstructions: "",
    onsiteVenue: "",
    onsiteSchedule: "",
    meetupLink: "",
    pendingReminder: "",
    completedReminder: "",
  });

  const loadDayIntoForm = (prog: AdminProgram, dayNumber: number) => {
    const existing = prog.days.find((d) => d.dayNumber === dayNumber);
    const progCoaches = parseTagList(prog.coachName);
    const progRecommended = parseTagList(prog.recommendedFor);

    if (existing) {
      const normalizedType =
        existing.dayType === "REST_DAY"
          ? "REST_DAY"
          : existing.dayType === "MEETUP_DAY"
          ? "MEETUP_DAY"
          : "TRAINING_DAY";

      setDayForm({
        title: existing.title,
        dayType: normalizedType,
        coachName: existing.coachName || (progCoaches[0] || ""),
        recommendedFor: existing.recommendedFor || (progRecommended[0] || ""),
        videoUrl: existing.videoUrl || "",
        videoChecklist:
          existing.videoChecklist && existing.videoChecklist.length > 0
            ? existing.videoChecklist
            : ["Complete today's session"],
        mealRecommendation: existing.mealRecommendation || "",
        dailyAssessment: existing.dailyAssessment || "",
        restInstructions: existing.restInstructions || "",
        onsiteVenue: existing.onsiteVenue || "",
        onsiteSchedule: existing.onsiteSchedule || "",
        meetupLink: existing.meetupLink || "",
        pendingReminder: existing.pendingReminder || "",
        completedReminder: existing.completedReminder || "",
      });
    } else {
      setDayForm({
        title: `Day ${dayNumber}: Daily Session`,
        dayType: "TRAINING_DAY",
        coachName: progCoaches[0] || "",
        recommendedFor: progRecommended[0] || "",
        videoUrl: "https://www.youtube.com/embed/v7AYKMP6rOE",
        videoChecklist: [
          "Complete today's workout video",
          "Drink 2.5L of water",
          "Finish dinner before 19:30",
        ],
        mealRecommendation:
          "High-protein breakfast, balanced lunch with greens, and light dinner before 19:30.",
        dailyAssessment: "How did your body feel during today's session?",
        restInstructions: "",
        onsiteVenue: "",
        onsiteSchedule: "",
        meetupLink: "",
        pendingReminder: `Day ${dayNumber} is ready. Complete your session before 23:59.`,
        completedReminder: `Well done on completing Day ${dayNumber}! Rest well tonight.`,
      });
    }
  };

  const loadMetaIntoForm = (prog: AdminProgram) => {
    setMetaForm({
      title: prog.title,
      coachName: prog.coachName,
      recommendedFor: prog.recommendedFor || "All Levels",
      description: prog.description,
      durationDays: prog.durationDays || 21,
      price: prog.price,
      maxQuota: prog.maxQuota,
      communityLink: prog.communityLink || "",
      locationType: ((prog.locationType as "ONLINE" | "ONSITE" | "HYBRID") || "ONLINE"),
      city: prog.city || "",
      venueAddress: prog.venueAddress || "",
      virtualFallbackAvailable: prog.virtualFallbackAvailable ?? true,
      startDate: toInputDate(prog.startDate),
      endDate: toInputDate(prog.endDate),
      registrationDeadline: toInputDate(prog.registrationDeadline),
    });
  };

  const openProgramDetail = (prog: AdminProgram, initialDay?: number) => {
    setSelectedProgramId(prog.id);
    setIsCreatingProgram(false);
    setActiveMenu("programs");
    setFeedback(null);
    loadMetaIntoForm(prog);

    const targetDay =
      initialDay ??
      (() => {
        for (let d = 1; d <= (prog.durationDays || 21); d++) {
          const found = prog.days.find((x) => x.dayNumber === d);
          if (!isDayFilled(found)) return d;
        }
        return 1;
      })();

    setSelectedDayNum(targetDay);
    setDayBatchPage(Math.ceil(targetDay / DAY_BATCH_SIZE));
    loadDayIntoForm(prog, targetDay);
    setProgramDetailTab("schedule");
  };

  const handleSelectDay = (prog: AdminProgram, dayNum: number) => {
    setSelectedDayNum(dayNum);
    setDayBatchPage(Math.ceil(dayNum / DAY_BATCH_SIZE));
    setFeedback(null);
    loadDayIntoForm(prog, dayNum);
  };

  const handleSaveDay = async (prog: AdminProgram, moveNext = false) => {
    setSavingDay(true);
    setFeedback(null);

    try {
      const cleanedChecklist = dayForm.videoChecklist
        .map((item) => item.trim())
        .filter(Boolean);

      const res = await wellnessAdminSaveProgramDay({
        programId: prog.id,
        dayNumber: selectedDayNum,
        title: dayForm.title,
        dayType: dayForm.dayType,
        coachName: dayForm.dayType === "REST_DAY" ? "" : dayForm.coachName,
        recommendedFor: dayForm.dayType === "REST_DAY" ? "" : dayForm.recommendedFor,
        videoUrl: dayForm.dayType === "TRAINING_DAY" ? dayForm.videoUrl : "",
        videoChecklist:
          dayForm.dayType === "TRAINING_DAY"
            ? cleanedChecklist.length > 0
              ? cleanedChecklist
              : ["Complete today's workout"]
            : [],
        mealRecommendation: dayForm.mealRecommendation,
        dailyAssessment: dayForm.dailyAssessment,
        restInstructions:
          dayForm.dayType === "REST_DAY" ? dayForm.restInstructions : "",
        onsiteVenue:
          dayForm.dayType === "MEETUP_DAY" ? dayForm.onsiteVenue : "",
        onsiteSchedule:
          dayForm.dayType === "MEETUP_DAY" ? dayForm.onsiteSchedule : "",
        meetupLink:
          dayForm.dayType === "MEETUP_DAY" ? dayForm.meetupLink : "",
        pendingReminder: dayForm.pendingReminder,
        completedReminder: dayForm.completedReminder,
      });

      if (res.success && res.data) {
        const savedDay = res.data as AdminProgramDay;
        const updatedPrograms = programs.map((p) => {
          if (p.id !== prog.id) return p;
          const otherDays = p.days.filter((d) => d.dayNumber !== selectedDayNum);
          const nextDays = [...otherDays, savedDay].sort(
            (a, b) => a.dayNumber - b.dayNumber
          );
          return {
            ...p,
            days: nextDays,
            dayCount: nextDays.length,
          };
        });
        setPrograms(updatedPrograms);
        const updatedProg = updatedPrograms.find((p) => p.id === prog.id)!;

        if (moveNext && selectedDayNum < updatedProg.durationDays) {
          const nextDay = selectedDayNum + 1;
          setSelectedDayNum(nextDay);
          setDayBatchPage(Math.ceil(nextDay / DAY_BATCH_SIZE));
          loadDayIntoForm(updatedProg, nextDay);
          setFeedback({
            type: "success",
            text: `Day ${selectedDayNum} saved. Moved to Day ${nextDay}.`,
          });
        } else {
          setFeedback({
            type: "success",
            text: `Day ${selectedDayNum} saved.`,
          });
        }
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          text: res.message || "Unable to save day.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Network error while saving day.",
      });
    } finally {
      setSavingDay(false);
    }
  };

  const handleClearDay = async (prog: AdminProgram) => {
    setSavingDay(true);
    setFeedback(null);
    try {
      const res = await wellnessAdminDeleteProgramDay(prog.id, selectedDayNum);
      if (res.success) {
        const updatedPrograms = programs.map((p) => {
          if (p.id !== prog.id) return p;
          const nextDays = p.days.filter((d) => d.dayNumber !== selectedDayNum);
          return {
            ...p,
            days: nextDays,
            dayCount: nextDays.length,
            isPublished: false,
          };
        });
        setPrograms(updatedPrograms);
        const updatedProg = updatedPrograms.find((p) => p.id === prog.id)!;
        loadDayIntoForm(updatedProg, selectedDayNum);
        setFeedback({
          type: "success",
          text: `Day ${selectedDayNum} cleared. Program moved to Draft.`,
        });
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          text: res.message || "Failed to clear day.",
        });
      }
    } finally {
      setSavingDay(false);
    }
  };

  const handleSaveMeta = async (prog: AdminProgram) => {
    setSavingMeta(true);
    setFeedback(null);
    try {
      const res = await wellnessAdminUpdateProgramMeta({
        programId: prog.id,
        title: metaForm.title,
        coachName: metaForm.coachName,
        recommendedFor: metaForm.recommendedFor,
        description: metaForm.description,
        durationDays: Number(metaForm.durationDays) || 21,
        price: Number(metaForm.price) || 0,
        maxQuota: Number(metaForm.maxQuota) || 35,
        communityLink: metaForm.communityLink,
        locationType: metaForm.locationType,
        city: metaForm.city.trim() || undefined,
        venueAddress: metaForm.venueAddress.trim() || undefined,
        virtualFallbackAvailable: metaForm.virtualFallbackAvailable,
        startDate: new Date(metaForm.startDate),
        endDate: new Date(metaForm.endDate),
        registrationDeadline: new Date(metaForm.registrationDeadline),
      });

      if (res.success) {
        setPrograms((prev) =>
          prev.map((p) =>
            p.id === prog.id
              ? {
                  ...p,
                  title: metaForm.title,
                  coachName: metaForm.coachName,
                  recommendedFor: metaForm.recommendedFor,
                  description: metaForm.description,
                  durationDays: Number(metaForm.durationDays) || 21,
                  price: Number(metaForm.price) || 0,
                  maxQuota: Number(metaForm.maxQuota) || 35,
                  communityLink: metaForm.communityLink || null,
                  locationType: metaForm.locationType,
                  city: metaForm.city.trim() || null,
                  venueAddress: metaForm.venueAddress.trim() || null,
                  virtualFallbackAvailable: metaForm.virtualFallbackAvailable,
                  startDate: metaForm.startDate,
                  endDate: metaForm.endDate,
                  registrationDeadline: metaForm.registrationDeadline,
                }
              : p
          )
        );
        setFeedback({
          type: "success",
          text: "Program information updated.",
        });
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          text: res.message || "Unable to update program info.",
        });
      }
    } finally {
      setSavingMeta(false);
    }
  };

  const handleCreateProgramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim()) {
      setCreateError("Please enter a Program Title.");
      return;
    }
    if (!createForm.coachName.trim()) {
      setCreateError("Please provide the Lead Coach name.");
      return;
    }
    if (createForm.description.trim().length < 10) {
      setCreateError("Description must be at least 10 characters.");
      return;
    }

    setCreatingLoading(true);
    setCreateError(null);

    try {
      const res = await wellnessAdminCreateProgram({
        title: createForm.title.trim(),
        coachName: createForm.coachName.trim(),
        recommendedFor: createForm.recommendedFor.trim(),
        description: createForm.description.trim(),
        durationDays: Number(createForm.durationDays) || 21,
        price: Number(createForm.price) || 0,
        maxQuota: Number(createForm.maxQuota) || 35,
        communityLink: createForm.communityLink.trim() || undefined,
        locationType: createForm.locationType,
        city: createForm.city.trim() || undefined,
        venueAddress: createForm.venueAddress.trim() || undefined,
        virtualFallbackAvailable: createForm.virtualFallbackAvailable,
        startDate: new Date(createForm.startDate),
        endDate: new Date(createForm.endDate),
        registrationDeadline: new Date(createForm.registrationDeadline),
        days: [],
      });

      if (res.success && res.data) {
        const created = res.data as {
          id: string;
          title: string;
          slug: string;
          description: string;
          recommendedFor: string;
          coachName: string;
          durationDays: number;
          price: number;
          maxQuota: number;
          communityLink: string | null;
          locationType?: string | null;
          city?: string | null;
          venueAddress?: string | null;
          virtualFallbackAvailable?: boolean | null;
          startDate: Date | string;
          endDate: Date | string;
          registrationDeadline: Date | string;
          isPublished: boolean;
        };

        const formattedNewProgram: AdminProgram = {
          id: created.id,
          title: created.title,
          slug: created.slug,
          description: created.description,
          recommendedFor: created.recommendedFor,
          coachName: created.coachName,
          durationDays: created.durationDays,
          price: created.price,
          maxQuota: created.maxQuota,
          communityLink: created.communityLink,
          locationType: created.locationType || createForm.locationType,
          city: created.city || createForm.city || null,
          venueAddress: created.venueAddress || createForm.venueAddress || null,
          virtualFallbackAvailable: created.virtualFallbackAvailable ?? createForm.virtualFallbackAvailable,
          startDate: created.startDate,
          endDate: created.endDate,
          registrationDeadline: created.registrationDeadline,
          isPublished: false,
          dayCount: 0,
          activeSubscribers: 0,
          pendingSubscribers: 0,
          days: [],
        };

        setPrograms((prev) => [formattedNewProgram, ...prev]);
        setIsCreatingProgram(false);
        openProgramDetail(formattedNewProgram, 1);
        setFeedback({
          type: "success",
          text: `Program "${formattedNewProgram.title}" created. You can now plan the daily schedule.`,
        });
        router.refresh();
      } else {
        setCreateError(res.message || "Failed to create program.");
      }
    } catch {
      setCreateError("An unexpected error occurred while creating program.");
    } finally {
      setCreatingLoading(false);
    }
  };

  const validateProgramForPublish = (prog: AdminProgram) => {
    const missingDays: number[] = [];
    const targetDays = prog.durationDays || 21;
    for (let d = 1; d <= targetDays; d++) {
      const found = prog.days.find((x) => x.dayNumber === d);
      if (!isDayFilled(found)) {
        missingDays.push(d);
      }
    }

    const errors: string[] = [];
    if (!prog.title.trim()) {
      errors.push("Program Title is required.");
    }
    if (!prog.coachName.trim()) {
      errors.push("Lead Coach Name is required.");
    }
    if ((prog.description || "").trim().length < 15) {
      errors.push("Program description must be at least 15 characters long.");
    }
    if (prog.price < 0) {
      errors.push("Tuition fee cannot be negative.");
    }
    if (prog.maxQuota < 1) {
      errors.push("Participant capacity must be at least 1 seat.");
    }

    const startTs = new Date(prog.startDate).getTime();
    const deadlineTs = new Date(prog.registrationDeadline).getTime();
    const endTs = new Date(prog.endDate).getTime();

    if (isNaN(startTs) || isNaN(deadlineTs) || isNaN(endTs)) {
      errors.push("Cohort dates must be valid calendar dates.");
    } else {
      if (deadlineTs > startTs) {
        errors.push("Registration cutoff date cannot be after the cohort start date.");
      }
      if (endTs <= startTs) {
        errors.push("Cohort end date must be after the start date.");
      }
    }

    if (missingDays.length > 0) {
      errors.push(
        `Curriculum Incomplete: ${missingDays.length} out of ${targetDays} days are missing required routines (Day ${missingDays.slice(0, 7).join(", ")}${missingDays.length > 7 ? "..." : ""}).`
      );
    }

    return {
      valid: errors.length === 0,
      missingDays,
      errors,
    };
  };

  const handleInitiatePublish = (prog: AdminProgram) => {
    if (prog.isPublished) {
      // Unpublishing: allow direct toggle back to Draft so it can be revised
      handleTogglePublish(prog, false);
      return;
    }

    // Strict validation
    const validation = validateProgramForPublish(prog);
    if (!validation.valid) {
      setPublishModal({
        isOpen: true,
        mode: "ERROR",
        missingDays: validation.missingDays,
        errorList: validation.errors,
      });
      return;
    }

    // Passed validation: prompt confirmation guard
    setPublishModal({
      isOpen: true,
      mode: "CONFIRM",
    });
  };

  const handleTogglePublish = async (
    prog: AdminProgram,
    nextPublishState?: boolean
  ) => {
    const shouldPublish = nextPublishState ?? !prog.isPublished;
    setPublishingId(prog.id);
    setFeedback(null);
    try {
      const res = await wellnessAdminTogglePublishProgram(
        prog.id,
        shouldPublish
      );
      if (res.success && res.data) {
        setPrograms((prev) =>
          prev.map((p) =>
            p.id === prog.id ? { ...p, isPublished: res.data!.isPublished } : p
          )
        );
        setPublishModal(null);
        setFeedback({
          type: "success",
          text: shouldPublish
            ? `Program "${prog.title}" is now published and active! Information terms are now locked.`
            : `Program "${prog.title}" has been moved back to Draft. Information terms are editable again.`,
        });
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          text: res.message || "Failed to update publication status.",
        });
      }
    } finally {
      setPublishingId(null);
    }
  };

  const handleDeleteProgram = async (prog: AdminProgram) => {
    setDeletingProgId(prog.id);
    try {
      const res = await wellnessAdminDeleteProgram(prog.id);
      if (res.success) {
        setPrograms((prev) => prev.filter((p) => p.id !== prog.id));
        if (selectedProgramId === prog.id) {
          setSelectedProgramId(null);
        }
        router.refresh();
      }
    } finally {
      setDeletingProgId(null);
    }
  };

  const handleApprovePayment = async (enrollmentId: string) => {
    setApprovingId(enrollmentId);
    try {
      const res = await wellnessAdminApprovePayment(enrollmentId);
      if (res.success) {
        let approvedProgId: string | null = null;
        setUsers((prev) =>
          prev.map((u) => ({
            ...u,
            enrollments: u.enrollments.map((e) => {
              if (e.id === enrollmentId) {
                approvedProgId = e.program.id;
                return { ...e, status: "ACTIVE" };
              }
              return e;
            }),
          }))
        );

        if (approvedProgId) {
          setPrograms((prev) =>
            prev.map((p) =>
              p.id === approvedProgId
                ? {
                    ...p,
                    activeSubscribers: p.activeSubscribers + 1,
                    pendingSubscribers: Math.max(0, p.pendingSubscribers - 1),
                  }
                : p
            )
          );
        }

        setFeedback({
          type: "success",
          text: res.message || "Payment verified and activated.",
        });
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          text: res.message || "Failed to approve payment.",
        });
      }
    } finally {
      setApprovingId(null);
    }
  };

  const handleToggleUserRole = async (user: AdminUserItem) => {
    setUserActionLoading(user.id);
    try {
      const nextRole = user.role === "SUPERADMIN" ? "USER" : "SUPERADMIN";
      const res = await wellnessAdminUpdateUserRole(user.id, nextRole);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u))
        );
        setFeedback({
          type: "success",
          text: res.message || `Role updated to ${nextRole}.`,
        });
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          text: res.message || "Failed to update role.",
        });
      }
    } finally {
      setUserActionLoading(null);
    }
  };

  const handleDeleteUser = async (user: AdminUserItem) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete ${user.fullName} (${user.email})? This action cannot be undone.`
      )
    ) {
      return;
    }
    setUserActionLoading(user.id);
    try {
      const res = await wellnessAdminDeleteUser(user.id);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        setFeedback({
          type: "success",
          text: res.message || `Account ${user.fullName} deleted.`,
        });
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          text: res.message || "Failed to delete account.",
        });
      }
    } finally {
      setUserActionLoading(null);
    }
  };

  const handleToggleUserStatus = async (user: AdminUserItem) => {
    setUserActionLoading(user.id);
    try {
      const nextStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
      const res = await wellnessAdminUpdateUserStatus(user.id, nextStatus);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u))
        );
        router.refresh();
      }
    } finally {
      setUserActionLoading(null);
    }
  };

  const handleResetPassword = async (user: AdminUserItem) => {
    setUserActionLoading(user.id);
    try {
      const res = await wellnessAdminResetUserPassword(user.id);
      if (res.success && res.data) {
        setFeedback({
          type: "success",
          text: `Temporary password for ${user.fullName}: ${res.data.temporaryPassword}`,
        });
      }
    } finally {
      setUserActionLoading(null);
    }
  };

  const handleSignOut = async () => {
    await wellnessSignOut();
    router.push("/");
    router.refresh();
  };

  const pendingEnrollments = users.flatMap((u) =>
    u.enrollments
      .filter((e) => e.status === "PENDING")
      .map((e) => ({
        id: e.id,
        userFullName: u.fullName,
        userEmail: u.email,
        userPhone: u.phone,
        programTitle: e.program.title,
        amountPaid: e.program.price,
        paymentRef: e.paymentReference,
      }))
  );

  const liveProgramsCount = programs.filter((p) => p.isPublished).length;
  const draftProgramsCount = programs.length - liveProgramsCount;

  const approvedEnrollments = users.flatMap((u) =>
    u.enrollments.filter((e) => e.status === "ACTIVE")
  );

  const approvedRevenue = approvedEnrollments.reduce(
    (sum, e) => sum + (e.program.price || 0),
    0
  );

  const pendingRevenue = pendingEnrollments.reduce(
    (sum, e) => sum + (e.amountPaid || 0),
    0
  );

  const curriculumReadyCount = programs.filter((p) => {
    const targetDays = p.durationDays || 21;
    let filled = 0;
    for (let d = 1; d <= targetDays; d++) {
      const dayObj = p.days.find((x) => x.dayNumber === d);
      if (isDayFilled(dayObj)) filled++;
    }
    return filled >= targetDays;
  }).length;

  const activeUsersCount = users.filter((u) => u.status === "ACTIVE").length;
  const suspendedUsersCount = users.filter((u) => u.status === "SUSPENDED").length;
  const enrolledUsersCount = users.filter((u) => u.enrollments.length > 0).length;

  const filteredPrograms = programs.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(programSearch.toLowerCase()) ||
      p.coachName.toLowerCase().includes(programSearch.toLowerCase());
    if (!matchesSearch) return false;
    if (programFilter === "LIVE") return p.isPublished;
    if (programFilter === "DRAFT") return !p.isPublished;
    return true;
  });
  const totalProgramPages = Math.max(
    1,
    Math.ceil(filteredPrograms.length / PROGRAM_PAGE_SIZE)
  );
  const safeProgramPage = Math.min(programPage, totalProgramPages);
  const paginatedPrograms = filteredPrograms.slice(
    (safeProgramPage - 1) * PROGRAM_PAGE_SIZE,
    safeProgramPage * PROGRAM_PAGE_SIZE
  );

  const filteredMembers = users.filter((m) => {
    const matchesSearch =
      m.fullName.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
      (m.phone || "").toLowerCase().includes(memberSearch.toLowerCase());
    if (!matchesSearch) return false;
    if (memberFilter === "ACTIVE") {
      return m.enrollments.some((e) => e.status === "ACTIVE");
    }
    if (memberFilter === "PENDING") {
      return m.enrollments.some((e) => e.status === "PENDING");
    }
    return true;
  });
  const totalMemberPages = Math.max(
    1,
    Math.ceil(filteredMembers.length / MEMBER_PAGE_SIZE)
  );
  const safeMemberPage = Math.min(memberPage, totalMemberPages);
  const paginatedMembers = filteredMembers.slice(
    (safeMemberPage - 1) * MEMBER_PAGE_SIZE,
    safeMemberPage * MEMBER_PAGE_SIZE
  );

  const filteredQris = pendingEnrollments.filter(
    (q) =>
      q.userFullName.toLowerCase().includes(qrisSearch.toLowerCase()) ||
      q.userEmail.toLowerCase().includes(qrisSearch.toLowerCase()) ||
      q.programTitle.toLowerCase().includes(qrisSearch.toLowerCase())
  );
  const totalQrisPages = Math.max(
    1,
    Math.ceil(filteredQris.length / QRIS_PAGE_SIZE)
  );
  const safeQrisPage = Math.min(qrisPage, totalQrisPages);
  const paginatedQris = filteredQris.slice(
    (safeQrisPage - 1) * QRIS_PAGE_SIZE,
    safeQrisPage * QRIS_PAGE_SIZE
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row text-xs">
      {/* ================================================================= */}
      {/* STICKY GLASSMORPHIC LEFT SIDEBAR                                  */}
      {/* ================================================================= */}
      <aside className="w-full lg:w-60 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen glass-panel border-b lg:border-b-0 lg:border-r border-white/70 dark:border-white/10 flex flex-col justify-between p-6 z-30">
        <div className="space-y-8">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                <h1 className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-900 dark:text-white whitespace-nowrap">
                  Wellness
                </h1>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 truncate">
                {currentAdmin?.fullName || "Admin Console"}
              </p>
            </div>
            <ThemeToggle />
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1.5">
            <button
              type="button"
              onClick={() => {
                setActiveMenu("dashboard");
                setSelectedProgramId(null);
                setIsCreatingProgram(false);
                setFeedback(null);
              }}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-medium flex items-center justify-between transition whitespace-nowrap ${
                activeMenu === "dashboard"
                  ? "chrome-button"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-white/40 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                <span>Dashboard</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-600 dark:text-orange-400">
                Hub
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMenu("programs");
                setSelectedProgramId(null);
                setIsCreatingProgram(false);
                setFeedback(null);
              }}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-medium flex items-center justify-between transition whitespace-nowrap ${
                activeMenu === "programs"
                  ? "chrome-button"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-white/40 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span>Programs</span>
              </span>
              <span className="text-[11px] opacity-70">{programs.length}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMenu("members");
                setSelectedProgramId(null);
                setIsCreatingProgram(false);
                setFeedback(null);
              }}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-medium flex items-center justify-between transition whitespace-nowrap ${
                activeMenu === "members"
                  ? "chrome-button"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-white/40 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>Customers</span>
              </span>
              <span className="text-[11px] opacity-70">{users.length}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMenu("payments");
                setSelectedProgramId(null);
                setIsCreatingProgram(false);
                setFeedback(null);
              }}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-medium flex items-center justify-between transition whitespace-nowrap ${
                activeMenu === "payments"
                  ? "chrome-button"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-white/40 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <QrCode className="w-3.5 h-3.5 shrink-0" />
                <span>Payments</span>
              </span>
              {pendingEnrollments.length > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500 text-white">
                  {pendingEnrollments.length}
                </span>
              ) : (
                <span className="text-[11px] opacity-70">0</span>
              )}
            </button>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-5 border-t border-zinc-900/[0.06] dark:border-white/10 space-y-1.5">
          <Link
            href="/dashboard"
            className="w-full px-3.5 py-2 rounded-xl text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 flex items-center justify-between transition whitespace-nowrap"
          >
            <span>Member View</span>
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full px-3.5 py-2 rounded-xl text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 flex items-center gap-2 transition whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ================================================================= */}
      {/* MAIN WORKSPACE                                                    */}
      {/* ================================================================= */}
      <main className="flex-1 min-w-0 p-6 sm:p-8 lg:p-10 max-w-6xl mx-auto w-full space-y-6">
        {/* CONTEXTUAL TOP WIDGETS (Tailored to the active menu) */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {activeMenu === "dashboard" && (
            <>
              <div className="glass-panel rounded-3xl p-5 space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400 block whitespace-nowrap">
                  Total Programs
                </span>
                <div className="text-2xl font-light tracking-tight text-zinc-900 dark:text-white">
                  {programs.length}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  {liveProgramsCount} published • {draftProgramsCount} drafts
                </p>
              </div>

              <div className="glass-panel rounded-3xl p-5 space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400 block whitespace-nowrap">
                  Total Customers
                </span>
                <div className="text-2xl font-light tracking-tight text-zinc-900 dark:text-white">
                  {users.length}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  {activeUsersCount} active • {suspendedUsersCount} suspended
                </p>
              </div>

              <div className="glass-panel rounded-3xl p-5 space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400 block whitespace-nowrap">
                  Pending Approvals
                </span>
                <div className="text-2xl font-light tracking-tight text-orange-600 dark:text-orange-400">
                  {pendingEnrollments.length}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  Rp {pendingRevenue.toLocaleString("id-ID")} awaiting review
                </p>
              </div>

              <div className="glass-panel rounded-3xl p-5 space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400 block whitespace-nowrap">
                  Verified Revenue
                </span>
                <div className="text-2xl font-light tracking-tight text-zinc-900 dark:text-white">
                  Rp {approvedRevenue.toLocaleString("id-ID")}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  {approvedEnrollments.length} enrolled members
                </p>
              </div>
            </>
          )}

          {activeMenu === "programs" && (
            <>
              <div className="glass-panel rounded-3xl p-5 space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400 block whitespace-nowrap">
                  Total Programs
                </span>
                <div className="text-2xl font-light tracking-tight text-zinc-900 dark:text-white">
                  {programs.length}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  Cohort curriculums
                </p>
              </div>

              <div className="glass-panel rounded-3xl p-5 space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400 block whitespace-nowrap">
                  Published Cohorts
                </span>
                <div className="text-2xl font-light tracking-tight text-emerald-600 dark:text-emerald-400">
                  {liveProgramsCount}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  Live for enrollments
                </p>
              </div>

              <div className="glass-panel rounded-3xl p-5 space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400 block whitespace-nowrap">
                  Draft Cohorts
                </span>
                <div className="text-2xl font-light tracking-tight text-orange-600 dark:text-orange-400">
                  {draftProgramsCount}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  Curriculum in preparation
                </p>
              </div>

              <div className="glass-panel rounded-3xl p-5 space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400 block whitespace-nowrap">
                  Curriculum Ready
                </span>
                <div className="text-2xl font-light tracking-tight text-zinc-900 dark:text-white">
                  {curriculumReadyCount}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  {programs.length > 0 ? Math.round((curriculumReadyCount / programs.length) * 100) : 0}% fully scheduled
                </p>
              </div>
            </>
          )}

          {activeMenu === "members" && (
            <>
              <div className="glass-panel rounded-3xl p-5 space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400 block whitespace-nowrap">
                  Total Customers
                </span>
                <div className="text-2xl font-light tracking-tight text-zinc-900 dark:text-white">
                  {users.length}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  Registered accounts
                </p>
              </div>

              <div className="glass-panel rounded-3xl p-5 space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400 block whitespace-nowrap">
                  Active Standing
                </span>
                <div className="text-2xl font-light tracking-tight text-emerald-600 dark:text-emerald-400">
                  {activeUsersCount}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  Full platform access
                </p>
              </div>

              <div className="glass-panel rounded-3xl p-5 space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400 block whitespace-nowrap">
                  Suspended Accounts
                </span>
                <div className="text-2xl font-light tracking-tight text-zinc-400">
                  {suspendedUsersCount}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  Access restricted
                </p>
              </div>

              <div className="glass-panel rounded-3xl p-5 space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400 block whitespace-nowrap">
                  Enrolled Customers
                </span>
                <div className="text-2xl font-light tracking-tight text-orange-600 dark:text-orange-400">
                  {enrolledUsersCount}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  Active in cohort
                </p>
              </div>
            </>
          )}

          {activeMenu === "payments" && (
            <>
              <div className="glass-panel rounded-3xl p-5 space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400 block whitespace-nowrap">
                  Pending Approvals
                </span>
                <div className="text-2xl font-light tracking-tight text-orange-600 dark:text-orange-400">
                  {pendingEnrollments.length}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  Awaiting review
                </p>
              </div>

              <div className="glass-panel rounded-3xl p-5 space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400 block whitespace-nowrap">
                  Approved Orders
                </span>
                <div className="text-2xl font-light tracking-tight text-emerald-600 dark:text-emerald-400">
                  {approvedEnrollments.length}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  Verified payments
                </p>
              </div>

              <div className="glass-panel rounded-3xl p-5 space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400 block whitespace-nowrap">
                  Settled Revenue
                </span>
                <div className="text-2xl font-light tracking-tight text-zinc-900 dark:text-white">
                  Rp {approvedRevenue.toLocaleString("id-ID")}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  Tuition collected
                </p>
              </div>

              <div className="glass-panel rounded-3xl p-5 space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400 block whitespace-nowrap">
                  Pending Volume
                </span>
                <div className="text-2xl font-light tracking-tight text-zinc-500 dark:text-zinc-400">
                  Rp {pendingRevenue.toLocaleString("id-ID")}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  Unverified balance
                </p>
              </div>
            </>
          )}
        </section>

        {/* Feedback Banner */}
        {feedback && (
          <div className="glass-panel rounded-2xl px-5 py-3.5 text-xs flex items-center justify-between gap-3 border-orange-500/30">
            <span className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              )}
              {feedback.text}
            </span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-white whitespace-nowrap"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW 0: EXECUTIVE DASHBOARD (ALL WIDGETS COCKPIT)                 */}
        {/* ================================================================= */}
        {activeMenu === "dashboard" && (
          <div className="space-y-6">
            {/* Quick Actions & Welcome Bar */}
            <div className="glass-panel rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400 block">
                  Executive Sanctuary Overview
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  Operations & Cohort Cockpit
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Monitor live cohorts, verify member payments, and review customer standings in real time.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMenu("programs");
                    setSelectedProgramId(null);
                    setIsCreatingProgram(true);
                  }}
                  className="px-4 py-2.5 rounded-2xl chrome-button text-xs font-medium flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span>New Program</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMenu("payments")}
                  className="px-4 py-2.5 rounded-2xl glass-panel-subtle text-xs font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 whitespace-nowrap"
                >
                  <QrCode className="w-3.5 h-3.5 shrink-0" />
                  <span>Pending Payments ({pendingEnrollments.length})</span>
                </button>
              </div>
            </div>

            {/* 2-Column Split: Cohorts Health & Pending Approvals */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left Column: Cohorts Directory Snapshot */}
              <div className="glass-panel rounded-3xl overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-zinc-900/[0.06] dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-900 dark:text-white">
                      Active Programs ({programs.length})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveMenu("programs")}
                    className="text-[11px] font-medium text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                  >
                    View Directory <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="divide-y divide-zinc-900/[0.05] dark:divide-white/5 flex-1">
                  {programs.length === 0 ? (
                    <div className="p-8 text-center text-xs text-zinc-500">
                      No programs created yet.
                    </div>
                  ) : (
                    programs.slice(0, 4).map((prog) => {
                      const targetDays = prog.durationDays || 21;
                      let filledCount = 0;
                      for (let d = 1; d <= targetDays; d++) {
                        if (isDayFilled(prog.days.find((x) => x.dayNumber === d))) filledCount++;
                      }
                      const pct = Math.min(100, Math.round((filledCount / targetDays) * 100));

                      return (
                        <div
                          key={prog.id}
                          onClick={() => {
                            setActiveMenu("programs");
                            openProgramDetail(prog);
                          }}
                          className="p-5 hover:bg-white/30 dark:hover:bg-white/[0.02] cursor-pointer transition flex items-center justify-between gap-4"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  prog.isPublished
                                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                                    : "bg-orange-500/15 text-orange-700 dark:text-orange-300"
                                }`}
                              >
                                {prog.isPublished ? "Published" : "Draft"}
                              </span>
                              <span className="text-[11px] text-zinc-500 truncate">
                                {prog.coachName}
                              </span>
                            </div>
                            <h4 className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                              {prog.title}
                            </h4>
                            <div className="flex items-center gap-3 text-[10px] text-zinc-400">
                              <span>{filledCount}/{targetDays} days scheduled ({pct}%)</span>
                              <span>•</span>
                              <span>{prog.durationDays} Days</span>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            <span className="text-xs font-semibold text-zinc-900 dark:text-white whitespace-nowrap">
                              Rp {prog.price.toLocaleString("id-ID")}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Pending Payment Approvals */}
              <div className="glass-panel rounded-3xl overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-zinc-900/[0.06] dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-900 dark:text-white">
                      Payment Queue ({pendingEnrollments.length})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveMenu("payments")}
                    className="text-[11px] font-medium text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                  >
                    View All <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="divide-y divide-zinc-900/[0.05] dark:divide-white/5 flex-1">
                  {pendingEnrollments.length === 0 ? (
                    <div className="p-10 text-center space-y-2">
                      <CheckCircle2 className="w-6 h-6 text-zinc-400 mx-auto" />
                      <p className="text-xs font-medium text-zinc-900 dark:text-white">
                        All payments verified
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        Zero pending customer transactions.
                      </p>
                    </div>
                  ) : (
                    pendingEnrollments.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="p-5 flex items-center justify-between gap-4 hover:bg-white/30 dark:hover:bg-white/[0.02] transition"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                            {item.userFullName}
                          </p>
                          <p className="text-[11px] text-zinc-500 truncate">
                            {item.programTitle}
                          </p>
                          <p className="text-[11px] font-semibold text-orange-600 dark:text-orange-400">
                            Rp {item.amountPaid.toLocaleString("id-ID")}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleApprovePayment(item.id)}
                          disabled={approvingId === item.id}
                          className="px-3.5 py-1.5 rounded-xl chrome-button text-[11px] font-medium flex items-center gap-1 shrink-0 whitespace-nowrap"
                        >
                          {approvingId === item.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Approve</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Customers Overview Snapshot */}
            <div className="glass-panel rounded-3xl overflow-hidden">
              <div className="px-6 py-5 border-b border-zinc-900/[0.06] dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-900 dark:text-white">
                    Recent Customer Accounts
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMenu("members")}
                  className="text-[11px] font-medium text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                >
                  Manage All Customers ({users.length}) <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="divide-y divide-zinc-900/[0.05] dark:divide-white/5">
                {users.slice(0, 5).map((u) => (
                  <div
                    key={u.id}
                    className="p-5 flex items-center justify-between gap-4 hover:bg-white/30 dark:hover:bg-white/[0.02] transition"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                          {u.fullName}
                        </span>
                        <span
                          className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${
                            u.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-zinc-500/10 text-zinc-500"
                          }`}
                        >
                          {u.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {u.email} • {u.phone || "No phone"}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                        {u.enrollments.length} Program{u.enrollments.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW 1A: PROGRAMS LIST                                            */}
        {/* ================================================================= */}
        {activeMenu === "programs" && !selectedProgram && !isCreatingProgram && (
          <div className="space-y-6">
            {/* MIDDLE WIDGET: Search, Filter & New Program Button */}
            <div className="glass-panel rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={programSearch}
                  onChange={(e) => {
                    setProgramSearch(e.target.value);
                    setProgramPage(1);
                  }}
                  placeholder="Search programs..."
                  className="w-full pl-9 pr-4 py-2 rounded-2xl glass-input text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1 p-1 rounded-2xl glass-panel-subtle">
                  {(["ALL", "LIVE", "DRAFT"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setProgramFilter(status);
                        setProgramPage(1);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-[11px] font-medium transition whitespace-nowrap ${
                        programFilter === status
                          ? "chrome-button"
                          : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                      }`}
                    >
                      {status === "ALL"
                        ? "All"
                        : status === "LIVE"
                        ? "Published"
                        : "Draft"}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingProgram(true);
                    setSelectedProgramId(null);
                  }}
                  className="px-4 py-2 rounded-2xl chrome-button text-[11px] font-medium flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" /> New Program
                </button>
              </div>
            </div>

            {/* BOTTOM WIDGET: Programs List + Pagination */}
            <div className="glass-panel rounded-3xl overflow-hidden">
              <div className="px-7 py-5 border-b border-zinc-900/[0.06] dark:border-white/10 flex items-center justify-between gap-4">
                <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                  Programs Directory
                </h2>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:inline whitespace-nowrap">
                  Select a program to manage details and daily schedule
                </span>
              </div>

              {paginatedPrograms.length === 0 ? (
                <div className="p-14 text-center">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    No programs found.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-900/[0.06] dark:divide-white/10">
                  {paginatedPrograms.map((prog) => {
                    const targetDays = prog.durationDays || 21;
                    let filledCount = 0;
                    for (let d = 1; d <= targetDays; d++) {
                      const dayObj = prog.days.find((x) => x.dayNumber === d);
                      if (isDayFilled(dayObj)) filledCount++;
                    }
                    const progressPct = Math.min(
                      100,
                      Math.round((filledCount / targetDays) * 100)
                    );

                    return (
                      <div
                        key={prog.id}
                        className="p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-white/30 dark:hover:bg-white/[0.02] transition"
                      >
                        <div className="space-y-2 max-w-xl">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span
                              className={`text-[10px] font-semibold uppercase tracking-[0.14em] px-2.5 py-0.5 rounded-full whitespace-nowrap ${
                                prog.isPublished
                                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                                  : "bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/25"
                              }`}
                            >
                              {prog.isPublished ? "Published" : "Draft"}
                            </span>

                            {prog.locationType === "ONSITE" && (
                              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 whitespace-nowrap flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5" /> On-Site • {prog.city || "Studio"}
                              </span>
                            )}

                            {prog.locationType === "HYBRID" && (
                              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25 whitespace-nowrap flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5" /> Hybrid • {prog.city || "Studio"}
                              </span>
                            )}

                            {(!prog.locationType || prog.locationType === "ONLINE") && (
                              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/25 whitespace-nowrap">
                                🌐 Online
                              </span>
                            )}

                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                              {targetDays} Days • {prog.coachName}
                            </span>
                            <span className="text-[11px] font-medium text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                              Rp {prog.price.toLocaleString("id-ID")}
                            </span>
                          </div>

                          <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">
                            {prog.title}
                          </h3>

                          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
                            {prog.description}
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row lg:items-center gap-5 shrink-0">
                          <div className="w-full sm:w-40 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                                Schedule
                              </span>
                              <span className="font-medium text-zinc-900 dark:text-white whitespace-nowrap">
                                {filledCount} / {targetDays} days
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-zinc-900/10 dark:bg-white/10 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-zinc-900 dark:to-white transition-all duration-500"
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => openProgramDetail(prog)}
                            className="px-4 py-2.5 rounded-2xl chrome-button text-[11px] font-medium flex items-center justify-center gap-1.5 whitespace-nowrap"
                          >
                            <span>View Details</span>
                            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <PaginationBar
                currentPage={safeProgramPage}
                totalPages={totalProgramPages}
                totalItems={filteredPrograms.length}
                pageSize={PROGRAM_PAGE_SIZE}
                onPageChange={setProgramPage}
                itemLabel="programs"
              />
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW 1B: CREATE NEW PROGRAM (IN-PAGE GLASS PANEL - SAME AS EDIT)  */}
        {/* ================================================================= */}
        {activeMenu === "programs" && isCreatingProgram && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header with Back Button */}
            <div className="glass-panel rounded-3xl p-7 space-y-3">
              <button
                type="button"
                onClick={() => setIsCreatingProgram(false)}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition w-fit whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5 shrink-0" /> Back to Programs
              </button>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/25">
                  New Cohort
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {createForm.durationDays} Days • Rp {createForm.price.toLocaleString("id-ID")}
                </span>
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
                Create New Program
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
                Set up initial program parameters, cohort duration, and pricing. Once saved, you can immediately begin scheduling routines for each day.
              </p>
            </div>

            {/* Error banner if any */}
            {createError && (
              <div className="glass-panel rounded-2xl px-5 py-3.5 text-xs text-red-600 dark:text-red-400 border border-red-500/30">
                {createError}
              </div>
            )}

            {/* In-Page Form (Matches the exact styling of the Edit Info form!) */}
            <form onSubmit={handleCreateProgramSubmit} className="glass-panel rounded-3xl p-7 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-900/[0.06] dark:border-white/10 pb-4">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-900 dark:text-white">
                    Program Information
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Set general details, schedule dates, and tuition pricing
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    Program Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.title}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, title: e.target.value }))
                    }
                    placeholder="e.g. 21-Day Core Mobility & Longevity Protocol"
                    className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs"
                  />
                </div>

                <MultiTagInput
                  label="Coach / Instructors *"
                  subLabel="Press Enter to add multiple coaches"
                  placeholder="e.g. Coach Marcus Vance"
                  value={createForm.coachName}
                  onChange={(val) => setCreateForm((p) => ({ ...p, coachName: val }))}
                  icon={UserCheck}
                  chipColor="orange"
                  quickSuggestions={["Coach Marcus Vance", "Coach Sarah Jenkins", "Coach David Miller"]}
                />

                <div className="sm:col-span-2">
                  <MultiTagInput
                    label="Recommended For (Target Focus & Audience) *"
                    subLabel="Press Enter to add multiple target items"
                    placeholder="e.g. All Levels, Posture Correction"
                    value={createForm.recommendedFor}
                    onChange={(val) => setCreateForm((p) => ({ ...p, recommendedFor: val }))}
                    icon={Sparkles}
                    chipColor="zinc"
                    quickSuggestions={[
                      "All Levels",
                      "Fat Loss & Core",
                      "Mobility & Posture Recovery",
                      "Desk Workers",
                      "Strength & Tone",
                      "Beginner Friendly",
                    ]}
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={createForm.description}
                    onChange={(e) =>
                      setCreateForm((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe what members will experience, how the daily rhythm works, and who this is for..."
                    className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Duration (Days) *
                    </label>
                    <div className="flex items-center gap-1">
                      {[7, 14, 21, 30].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            setCreateForm((prev) => ({
                              ...prev,
                              durationDays: d,
                              endDate: computeEndDate(prev.startDate, d),
                            }));
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition ${
                            createForm.durationDays === d
                              ? "chrome-button"
                              : "glass-panel-subtle text-zinc-600 dark:text-zinc-400"
                          }`}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    required
                    value={createForm.durationDays}
                    onChange={(e) => {
                      const d = Number(e.target.value) || 1;
                      setCreateForm((prev) => ({
                        ...prev,
                        durationDays: d,
                        endDate: computeEndDate(prev.startDate, d),
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Price (IDR) *
                    </label>
                    <span className="text-[11px] text-zinc-400">
                      {createForm.price === 0
                        ? "Free"
                        : `Rp ${createForm.price.toLocaleString("id-ID")}`}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    required
                    value={createForm.price}
                    onChange={(e) =>
                      setCreateForm((p) => ({
                        ...p,
                        price: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    Max Participants *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={createForm.maxQuota}
                    onChange={(e) =>
                      setCreateForm((p) => ({
                        ...p,
                        maxQuota: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    Community Group Link
                  </label>
                  <input
                    type="url"
                    value={createForm.communityLink}
                    onChange={(e) =>
                      setCreateForm((p) => ({
                        ...p,
                        communityLink: e.target.value,
                      }))
                    }
                    placeholder="https://chat.whatsapp.com/..."
                    className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    Program Format & Attendance Mode
                  </label>
                  <div className="grid sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setCreateForm((p) => ({ ...p, locationType: "ONLINE" }))}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        createForm.locationType === "ONLINE"
                          ? "bg-orange-500/15 border-orange-500 text-orange-600 dark:text-orange-400 shadow-sm"
                          : "glass-panel-subtle text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                      }`}
                    >
                      🌐 100% Online
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateForm((p) => ({ ...p, locationType: "ONSITE" }))}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        createForm.locationType === "ONSITE"
                          ? "bg-orange-500/15 border-orange-500 text-orange-600 dark:text-orange-400 shadow-sm"
                          : "glass-panel-subtle text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                      }`}
                    >
                      📍 On-Site Session
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateForm((p) => ({ ...p, locationType: "HYBRID" }))}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        createForm.locationType === "HYBRID"
                          ? "bg-orange-500/15 border-orange-500 text-orange-600 dark:text-orange-400 shadow-sm"
                          : "glass-panel-subtle text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                      }`}
                    >
                      ✨ Hybrid (Studio & Live)
                    </button>
                  </div>
                </div>

                {createForm.locationType !== "ONLINE" && (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                        City / Location (e.g. Jakarta Selatan) *
                      </label>
                      <input
                        type="text"
                        value={createForm.city}
                        onChange={(e) => setCreateForm((p) => ({ ...p, city: e.target.value }))}
                        placeholder="Jakarta Selatan, Bali, Surabaya..."
                        className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                        Studio / Physical Venue Address
                      </label>
                      <input
                        type="text"
                        value={createForm.venueAddress}
                        onChange={(e) => setCreateForm((p) => ({ ...p, venueAddress: e.target.value }))}
                        placeholder="The Sanctuary Studio, Senopati Lot 8"
                        className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center gap-2 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                      <input
                        type="checkbox"
                        id="createVirtualFallback"
                        checked={createForm.virtualFallbackAvailable}
                        onChange={(e) => setCreateForm((p) => ({ ...p, virtualFallbackAvailable: e.target.checked }))}
                        className="rounded text-orange-500 focus:ring-orange-500"
                      />
                      <label htmlFor="createVirtualFallback" className="text-xs text-zinc-800 dark:text-zinc-200 cursor-pointer">
                        Izinkan peserta luar kota mengikuti sesi on-site secara live streaming Zoom / Meet
                      </label>
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={createForm.startDate}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setCreateForm((p) => ({
                        ...p,
                        startDate: newStart,
                        endDate: computeEndDate(newStart, p.durationDays),
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    Registration Deadline *
                  </label>
                  <input
                    type="date"
                    required
                    value={createForm.registrationDeadline}
                    onChange={(e) =>
                      setCreateForm((p) => ({
                        ...p,
                        registrationDeadline: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    End Date (Auto-calculated)
                  </label>
                  <input
                    type="date"
                    required
                    value={createForm.endDate}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, endDate: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-900/[0.06] dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreatingProgram(false)}
                  className="px-4 py-2 rounded-2xl glass-panel-subtle text-[11px] font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingLoading}
                  className="px-5 py-2 rounded-2xl chrome-button text-[11px] font-medium flex items-center gap-1.5 whitespace-nowrap"
                >
                  {creatingLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      <span>Saving Program...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 shrink-0" />
                      <span>Save Draft & Plan Daily Schedule</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW 1C: PROGRAM DETAIL (INFO + DAILY SCHEDULE)                   */}
        {/* ================================================================= */}
        {activeMenu === "programs" && selectedProgram && (() => {
          const targetDays = selectedProgram.durationDays || 21;
          let filledCount = 0;
          for (let d = 1; d <= targetDays; d++) {
            if (isDayFilled(selectedProgram.days.find((x) => x.dayNumber === d))) {
              filledCount++;
            }
          }
          const allFilled = filledCount >= targetDays;

          return (
            <div className="space-y-6">
              {/* Program Detail Header Widget */}
              <div className="glass-panel rounded-3xl p-7 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedProgramId(null)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition w-fit whitespace-nowrap"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 shrink-0" /> Back to Programs
                  </button>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleInitiatePublish(selectedProgram)}
                      disabled={publishingId === selectedProgram.id}
                      className={`px-4 py-2 rounded-2xl text-[11px] font-medium flex items-center gap-1.5 transition whitespace-nowrap ${
                        selectedProgram.isPublished
                          ? "glass-panel-subtle text-zinc-800 dark:text-zinc-200"
                          : allFilled
                          ? "chrome-button shadow-sm"
                          : "glass-panel-subtle text-amber-600 dark:text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {publishingId === selectedProgram.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      ) : selectedProgram.isPublished ? (
                        <>
                          <Unlock className="w-3.5 h-3.5 shrink-0" />
                          <span>Unpublish Cohort</span>
                        </>
                      ) : (
                        <>
                          <Globe className="w-3.5 h-3.5 shrink-0" />
                          <span>Publish Program</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteProgram(selectedProgram)}
                      disabled={deletingProgId === selectedProgram.id}
                      className="p-2 rounded-2xl glass-panel-subtle text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition"
                      title="Delete Program"
                    >
                      {deletingProgId === selectedProgram.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-[0.14em] px-2.5 py-0.5 rounded-full whitespace-nowrap ${
                        selectedProgram.isPublished
                          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                          : "bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/25"
                      }`}
                    >
                      {selectedProgram.isPublished ? "Published & Live" : "Draft"}
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {selectedProgram.durationDays} Days • {selectedProgram.coachName} • Rp{" "}
                      {selectedProgram.price.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
                    {selectedProgram.title}
                  </h2>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
                    {selectedProgram.description}
                  </p>
                </div>
              </div>

              {/* TWO-TAB NAVIGATOR: PROGRAM INFORMATION & DAILY SCHEDULE */}
              <div className="flex items-center gap-2 p-1.5 rounded-2xl glass-panel-subtle w-fit">
                <button
                  type="button"
                  onClick={() => setProgramDetailTab("info")}
                  className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                    programDetailTab === "info"
                      ? "chrome-button shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  {selectedProgram.isPublished ? (
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                    <FileEdit className="w-3.5 h-3.5" />
                  )}
                  <span>Program Information</span>
                  {selectedProgram.isPublished && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider">
                      Locked
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setProgramDetailTab("schedule")}
                  className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                    programDetailTab === "schedule"
                      ? "chrome-button shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Daily Schedule</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full glass-panel-subtle font-medium">
                    {filledCount}/{targetDays} days
                  </span>
                </button>
              </div>

              {/* ============================================================= */}
              {/* TAB 1: PROGRAM INFORMATION (EXACT SAME FORM AS CREATE)        */}
              {/* ============================================================= */}
              {programDetailTab === "info" && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Lock Warning Card if Program is Published */}
                  {selectedProgram.isPublished && (
                    <div className="glass-panel rounded-3xl p-5 border border-amber-500/30 flex items-start gap-3.5 bg-amber-500/5">
                      <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                          <span>Cohort Terms Locked</span>
                          <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
                            Live & Active
                          </span>
                        </h4>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                          This program is currently published and open for member enrollments. Core parameters (pricing, duration, quota, and dates) are locked to protect paying customers and maintain cohort integrity. You must unpublish the program first if you need to modify core terms.
                        </p>
                      </div>
                    </div>
                  )}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (selectedProgram.isPublished) return;
                      handleSaveMeta(selectedProgram);
                    }}
                    className="glass-panel rounded-3xl p-7 space-y-6"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-900/[0.06] dark:border-white/10 pb-4">
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-900 dark:text-white">
                          Program Information
                        </h3>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {selectedProgram.isPublished
                            ? "Core terms are locked while this cohort is live"
                            : "Update general details, schedule dates, and tuition pricing"}
                        </p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Program Title *
                        </label>
                        <input
                          type="text"
                          required
                          disabled={selectedProgram.isPublished}
                          value={metaForm.title}
                          onChange={(e) =>
                            setMetaForm((p) => ({ ...p, title: e.target.value }))
                          }
                          placeholder="e.g. 21-Day Core Mobility & Longevity Protocol"
                          className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>

                      <MultiTagInput
                        label="Coach / Instructors *"
                        subLabel="Press Enter to add multiple coaches"
                        placeholder="e.g. Coach Marcus Vance"
                        disabled={selectedProgram.isPublished}
                        value={metaForm.coachName}
                        onChange={(val) => setMetaForm((p) => ({ ...p, coachName: val }))}
                        icon={UserCheck}
                        chipColor="orange"
                        quickSuggestions={["Coach Marcus Vance", "Coach Sarah Jenkins", "Coach David Miller"]}
                      />

                      <div className="sm:col-span-2">
                        <MultiTagInput
                          label="Recommended For (Target Focus & Audience) *"
                          subLabel="Press Enter to add multiple target items"
                          placeholder="e.g. All Levels, Posture Correction"
                          disabled={selectedProgram.isPublished}
                          value={metaForm.recommendedFor}
                          onChange={(val) => setMetaForm((p) => ({ ...p, recommendedFor: val }))}
                          icon={Sparkles}
                          chipColor="zinc"
                          quickSuggestions={[
                            "All Levels",
                            "Fat Loss & Core",
                            "Mobility & Posture Recovery",
                            "Desk Workers",
                            "Strength & Tone",
                            "Beginner Friendly",
                          ]}
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1.5">
                        <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Description *
                        </label>
                        <textarea
                          rows={3}
                          required
                          disabled={selectedProgram.isPublished}
                          value={metaForm.description}
                          onChange={(e) =>
                            setMetaForm((p) => ({
                              ...p,
                              description: e.target.value,
                            }))
                          }
                          placeholder="Describe what members will experience, how the daily rhythm works, and who this is for..."
                          className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs leading-relaxed disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                            Duration (Days) *
                          </label>
                          {!selectedProgram.isPublished && (
                            <div className="flex items-center gap-1">
                              {[7, 14, 21, 30].map((d) => (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => {
                                    setMetaForm((prev) => ({
                                      ...prev,
                                      durationDays: d,
                                      endDate: computeEndDate(prev.startDate, d),
                                    }));
                                  }}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition ${
                                    metaForm.durationDays === d
                                      ? "chrome-button"
                                      : "glass-panel-subtle text-zinc-600 dark:text-zinc-400"
                                  }`}
                                >
                                  {d}d
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <input
                          type="number"
                          min={1}
                          max={90}
                          required
                          disabled={selectedProgram.isPublished}
                          value={metaForm.durationDays}
                          onChange={(e) => {
                            const d = Number(e.target.value) || 1;
                            setMetaForm((prev) => ({
                              ...prev,
                              durationDays: d,
                              endDate: computeEndDate(prev.startDate, d),
                            }));
                          }}
                          className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                            Price (IDR) *
                          </label>
                          <span className="text-[11px] text-zinc-400">
                            {metaForm.price === 0
                              ? "Free"
                              : `Rp ${metaForm.price.toLocaleString("id-ID")}`}
                          </span>
                        </div>
                        <input
                          type="number"
                          min={0}
                          step={1000}
                          required
                          disabled={selectedProgram.isPublished}
                          value={metaForm.price}
                          onChange={(e) =>
                            setMetaForm((p) => ({
                              ...p,
                              price: Number(e.target.value),
                            }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Max Participants *
                        </label>
                        <input
                          type="number"
                          min={1}
                          required
                          disabled={selectedProgram.isPublished}
                          value={metaForm.maxQuota}
                          onChange={(e) =>
                            setMetaForm((p) => ({
                              ...p,
                              maxQuota: Number(e.target.value),
                            }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Community Group Link
                        </label>
                        <input
                          type="url"
                          disabled={selectedProgram.isPublished}
                          value={metaForm.communityLink}
                          onChange={(e) =>
                            setMetaForm((p) => ({
                              ...p,
                              communityLink: e.target.value,
                            }))
                          }
                          placeholder="https://chat.whatsapp.com/..."
                          className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Program Format & Attendance Mode
                        </label>
                        <div className="grid sm:grid-cols-3 gap-2">
                          <button
                            type="button"
                            disabled={selectedProgram.isPublished}
                            onClick={() => setMetaForm((p) => ({ ...p, locationType: "ONLINE" }))}
                            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-60 disabled:cursor-not-allowed ${
                              metaForm.locationType === "ONLINE"
                                ? "bg-orange-500/15 border-orange-500 text-orange-600 dark:text-orange-400 shadow-sm"
                                : "glass-panel-subtle text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                            }`}
                          >
                            🌐 100% Online
                          </button>
                          <button
                            type="button"
                            disabled={selectedProgram.isPublished}
                            onClick={() => setMetaForm((p) => ({ ...p, locationType: "ONSITE" }))}
                            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-60 disabled:cursor-not-allowed ${
                              metaForm.locationType === "ONSITE"
                                ? "bg-orange-500/15 border-orange-500 text-orange-600 dark:text-orange-400 shadow-sm"
                                : "glass-panel-subtle text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                            }`}
                          >
                            📍 On-Site Session
                          </button>
                          <button
                            type="button"
                            disabled={selectedProgram.isPublished}
                            onClick={() => setMetaForm((p) => ({ ...p, locationType: "HYBRID" }))}
                            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-60 disabled:cursor-not-allowed ${
                              metaForm.locationType === "HYBRID"
                                ? "bg-orange-500/15 border-orange-500 text-orange-600 dark:text-orange-400 shadow-sm"
                                : "glass-panel-subtle text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                            }`}
                          >
                            ✨ Hybrid (Studio & Live)
                          </button>
                        </div>
                      </div>

                      {metaForm.locationType !== "ONLINE" && (
                        <>
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                              City / Location (e.g. Jakarta Selatan) *
                            </label>
                            <input
                              type="text"
                              disabled={selectedProgram.isPublished}
                              value={metaForm.city}
                              onChange={(e) => setMetaForm((p) => ({ ...p, city: e.target.value }))}
                              placeholder="Jakarta Selatan, Bali, Surabaya..."
                              className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                              Studio / Physical Venue Address
                            </label>
                            <input
                              type="text"
                              disabled={selectedProgram.isPublished}
                              value={metaForm.venueAddress}
                              onChange={(e) => setMetaForm((p) => ({ ...p, venueAddress: e.target.value }))}
                              placeholder="The Sanctuary Studio, Senopati Lot 8"
                              className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                          </div>

                          <div className="sm:col-span-2 flex items-center gap-2 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                            <input
                              type="checkbox"
                              id="editVirtualFallback"
                              disabled={selectedProgram.isPublished}
                              checked={metaForm.virtualFallbackAvailable}
                              onChange={(e) => setMetaForm((p) => ({ ...p, virtualFallbackAvailable: e.target.checked }))}
                              className="rounded text-orange-500 focus:ring-orange-500 disabled:opacity-60"
                            />
                            <label htmlFor="editVirtualFallback" className="text-xs text-zinc-800 dark:text-zinc-200 cursor-pointer">
                              Izinkan peserta luar kota mengikuti sesi on-site secara live streaming Zoom / Meet
                            </label>
                          </div>
                        </>
                      )}

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Start Date *
                        </label>
                        <input
                          type="date"
                          required
                          disabled={selectedProgram.isPublished}
                          value={metaForm.startDate}
                          onChange={(e) => {
                            const newStart = e.target.value;
                            setMetaForm((p) => ({
                              ...p,
                              startDate: newStart,
                              endDate: computeEndDate(newStart, p.durationDays),
                            }));
                          }}
                          className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Registration Deadline *
                        </label>
                        <input
                          type="date"
                          required
                          disabled={selectedProgram.isPublished}
                          value={metaForm.registrationDeadline}
                          onChange={(e) =>
                            setMetaForm((p) => ({
                              ...p,
                              registrationDeadline: e.target.value,
                            }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          End Date (Auto-calculated)
                        </label>
                        <input
                          type="date"
                          required
                          disabled={selectedProgram.isPublished}
                          value={metaForm.endDate}
                          onChange={(e) =>
                            setMetaForm((p) => ({ ...p, endDate: e.target.value }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-900/[0.06] dark:border-white/10">
                      {selectedProgram.isPublished ? (
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                          <span>Terms locked while published. Unpublish cohort to make changes.</span>
                        </div>
                      ) : (
                        <button
                          type="submit"
                          disabled={savingMeta}
                          className="px-6 py-2.5 rounded-2xl chrome-button text-[11px] font-medium flex items-center gap-1.5 whitespace-nowrap"
                        >
                          {savingMeta ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                          ) : (
                            <Save className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>Save Program Information</span>
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              )}

              {/* ============================================================= */}
              {/* TAB 2: DAILY SCHEDULE CURRICULUM                              */}
              {/* ============================================================= */}
              {programDetailTab === "schedule" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Day Selector Card (5-Column Spacious Grid — Never Stacks "Day 2") */}
            {(() => {
              const targetDays = selectedProgram.durationDays || 21;
              const allDays = Array.from({ length: targetDays }, (_, i) => i + 1);
              const totalDayBatches = Math.max(
                1,
                Math.ceil(allDays.length / DAY_BATCH_SIZE)
              );
              const safeBatch = Math.min(dayBatchPage, totalDayBatches);
              const visibleDays = allDays.slice(
                (safeBatch - 1) * DAY_BATCH_SIZE,
                safeBatch * DAY_BATCH_SIZE
              );

              let filledCount = 0;
              for (let d = 1; d <= targetDays; d++) {
                if (
                  isDayFilled(selectedProgram.days.find((x) => x.dayNumber === d))
                ) {
                  filledCount++;
                }
              }

              return (
                <div className="glass-panel rounded-3xl p-7 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-900 dark:text-white">
                        Daily Schedule
                      </h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {filledCount} of {targetDays} days filled
                      </p>
                    </div>

                    {totalDayBatches > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDayBatchPage(Math.max(1, safeBatch - 1))}
                          disabled={safeBatch <= 1}
                          className="px-3 py-1.5 rounded-xl glass-panel-subtle text-[11px] font-medium disabled:opacity-35 whitespace-nowrap"
                        >
                          Prev
                        </button>
                        <span className="text-[11px] text-zinc-500 px-2 whitespace-nowrap">
                          Days {(safeBatch - 1) * DAY_BATCH_SIZE + 1} –{" "}
                          {Math.min(targetDays, safeBatch * DAY_BATCH_SIZE)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setDayBatchPage(Math.min(totalDayBatches, safeBatch + 1))
                          }
                          disabled={safeBatch >= totalDayBatches}
                          className="px-3 py-1.5 rounded-xl glass-panel-subtle text-[11px] font-medium disabled:opacity-35 whitespace-nowrap"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 5 Columns per row = Wide, Luxury Day Pills that never squish text */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {visibleDays.map((dayNum) => {
                      const existing = selectedProgram.days.find(
                        (d) => d.dayNumber === dayNum
                      );
                      const filled = isDayFilled(existing);
                      const isSelected = selectedDayNum === dayNum;
                      const cleanSubtitle = existing?.title
                        ? existing.title.replace(/^Day\s+\d+[:\s-]*/i, "")
                        : "";

                      return (
                        <button
                          key={dayNum}
                          type="button"
                          onClick={() => handleSelectDay(selectedProgram, dayNum)}
                          className={`px-4 py-3 rounded-2xl text-left transition flex flex-col justify-between gap-2 min-h-[68px] ${
                            isSelected
                              ? "chrome-button"
                              : filled
                              ? "glass-panel-subtle border-orange-500/25 text-zinc-900 dark:text-white"
                              : "glass-panel-subtle opacity-65 hover:opacity-100 text-zinc-600 dark:text-zinc-400"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 w-full">
                            <span className="text-xs font-semibold tracking-tight whitespace-nowrap shrink-0">
                              Day {dayNum}
                            </span>

                            {filled ? (
                              <span
                                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? "bg-orange-500 text-white"
                                    : "bg-orange-500/15 text-orange-600 dark:text-orange-400"
                                }`}
                              >
                                <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                              </span>
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-30 shrink-0" />
                            )}
                          </div>

                          <span className="text-[11px] opacity-70 truncate block w-full">
                            {filled ? cleanSubtitle || "Completed" : "Empty"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Day Content Form */}
            <div className="glass-panel rounded-3xl p-7 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900/[0.06] dark:border-white/10 pb-5">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400 block">
                    Schedule Editor
                  </span>
                  <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white mt-0.5">
                    Day {selectedDayNum} of {selectedProgram.durationDays}
                  </h3>
                </div>

                {selectedProgram.days.some(
                  (d) => d.dayNumber === selectedDayNum
                ) && (
                  <button
                    type="button"
                    onClick={() => handleClearDay(selectedProgram)}
                    disabled={savingDay}
                    className="px-3.5 py-2 rounded-2xl glass-panel-subtle text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white text-[11px] font-medium flex items-center gap-1.5 w-fit whitespace-nowrap"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Clear Day {selectedDayNum}</span>
                  </button>
                )}
              </div>

              {/* Row 1: Day Title & Activity Type */}
              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    Day Title
                  </label>
                  <input
                    type="text"
                    placeholder={`e.g. Day ${selectedDayNum}: Core & Mobility`}
                    value={dayForm.title}
                    onChange={(e) =>
                      setDayForm((p) => ({ ...p, title: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    Activity Type
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(
                      [
                        {
                          value: "TRAINING_DAY",
                          label: "Workout",
                          icon: Dumbbell,
                        },
                        {
                          value: "REST_DAY",
                          label: "Rest Day",
                          icon: Coffee,
                        },
                        {
                          value: "MEETUP_DAY",
                          label: "Meetup",
                          icon: MapPin,
                        },
                      ] as const
                    ).map((typeOpt) => {
                      const Icon = typeOpt.icon;
                      const active = dayForm.dayType === typeOpt.value;
                      return (
                        <button
                          key={typeOpt.value}
                          type="button"
                          onClick={() =>
                            setDayForm((p) => ({ ...p, dayType: typeOpt.value }))
                          }
                          className={`py-2.5 px-3 rounded-2xl text-[11px] font-medium flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
                            active
                              ? "chrome-button"
                              : "glass-panel-subtle text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{typeOpt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Row 1B: Assigned Coach & Focus Target for Today (Hidden for REST_DAY) */}
              {dayForm.dayType !== "REST_DAY" && (
                <div className="grid md:grid-cols-2 gap-5 p-4 sm:p-5 rounded-2xl glass-panel-subtle border border-zinc-200/60 dark:border-white/10">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <span>Lead Coach for Day {selectedDayNum}</span>
                      </label>
                      <span className="text-[10px] text-zinc-400">From Program Coaches</span>
                    </div>

                    <select
                      value={dayForm.coachName}
                      onChange={(e) => setDayForm((p) => ({ ...p, coachName: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs"
                    >
                      <option value="">— Select Coach for Today —</option>
                      {parseTagList(selectedProgram.coachName).map((coach, idx) => (
                        <option key={idx} value={coach}>
                          {coach}
                        </option>
                      ))}
                    </select>

                    {parseTagList(selectedProgram.coachName).length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-zinc-400">Quick select:</span>
                        {parseTagList(selectedProgram.coachName).map((coach, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setDayForm((p) => ({ ...p, coachName: coach }))}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-medium transition ${
                              dayForm.coachName === coach
                                ? "chrome-button shadow-sm"
                                : "bg-white/40 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-white/10"
                            }`}
                          >
                            {coach}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <span>Day Focus / Recommended Target</span>
                      </label>
                      <span className="text-[10px] text-zinc-400">From Program Focus</span>
                    </div>

                    <select
                      value={dayForm.recommendedFor}
                      onChange={(e) => setDayForm((p) => ({ ...p, recommendedFor: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs"
                    >
                      <option value="">— Select Target Goal for Today —</option>
                      {parseTagList(selectedProgram.recommendedFor).map((item, idx) => (
                        <option key={idx} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>

                    {parseTagList(selectedProgram.recommendedFor).length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-zinc-400">Quick select:</span>
                        {parseTagList(selectedProgram.recommendedFor).map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setDayForm((p) => ({ ...p, recommendedFor: item }))}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-medium transition ${
                              dayForm.recommendedFor === item
                                ? "chrome-button shadow-sm"
                                : "bg-white/40 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-white/10"
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Row 2: Conditional Fields based on Activity Type */}
              {dayForm.dayType === "TRAINING_DAY" && (
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>Workout Video Link</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={dayForm.videoUrl}
                        onChange={(e) =>
                          setDayForm((p) => ({ ...p, videoUrl: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs"
                      />
                      {dayForm.videoUrl && (
                        <p className="text-[11px] text-zinc-500 truncate">
                          Embed:{" "}
                          <span className="font-mono">
                            {normalizeVideoEmbed(dayForm.videoUrl).embedUrl}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>Meal Guide</span>
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Recommended meals and hydration for today..."
                        value={dayForm.mealRecommendation}
                        onChange={(e) =>
                          setDayForm((p) => ({
                            ...p,
                            mealRecommendation: e.target.value,
                          }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                        Daily Checklist
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setDayForm((p) => ({
                            ...p,
                            videoChecklist: [...p.videoChecklist, ""],
                          }))
                        }
                        className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:underline flex items-center gap-1 whitespace-nowrap"
                      >
                        <Plus className="w-3 h-3 shrink-0" /> Add Item
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {dayForm.videoChecklist.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2.5">
                          <input
                            type="text"
                            placeholder={`Checklist item ${idx + 1}`}
                            value={item}
                            onChange={(e) => {
                              const next = [...dayForm.videoChecklist];
                              next[idx] = e.target.value;
                              setDayForm((p) => ({ ...p, videoChecklist: next }));
                            }}
                            className="flex-1 px-3.5 py-2.5 rounded-2xl glass-input text-xs"
                          />
                          {dayForm.videoChecklist.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setDayForm((p) => ({
                                  ...p,
                                  videoChecklist: p.videoChecklist.filter(
                                    (_, i) => i !== idx
                                  ),
                                }))
                              }
                              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {dayForm.dayType === "REST_DAY" && (
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Rest & Recovery Guide
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Stretching, sleep, or light walk instructions..."
                      value={dayForm.restInstructions}
                      onChange={(e) =>
                        setDayForm((p) => ({
                          ...p,
                          restInstructions: e.target.value,
                        }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Meal Guide (Optional)
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Hydration and nutrition notes..."
                      value={dayForm.mealRecommendation}
                      onChange={(e) =>
                        setDayForm((p) => ({
                          ...p,
                          mealRecommendation: e.target.value,
                        }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {dayForm.dayType === "MEETUP_DAY" && (
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Meetup Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Senayan Park Studio, Jakarta"
                      value={dayForm.onsiteVenue}
                      onChange={(e) =>
                        setDayForm((p) => ({
                          ...p,
                          onsiteVenue: e.target.value,
                        }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Meetup Schedule
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 07:00 - 09:00 WIB"
                      value={dayForm.onsiteSchedule}
                      onChange={(e) =>
                        setDayForm((p) => ({
                          ...p,
                          onsiteSchedule: e.target.value,
                        }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Action Footer */}
              <div className="pt-5 border-t border-zinc-900/[0.06] dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Changes are saved immediately to this program.
                </span>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSaveDay(selectedProgram, false)}
                    disabled={savingDay}
                    className="px-4 py-2.5 rounded-2xl glass-panel-subtle text-[11px] font-medium text-zinc-900 dark:text-white flex items-center gap-1.5 whitespace-nowrap"
                  >
                    {savingDay ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    ) : (
                      <Save className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>Save Day {selectedDayNum}</span>
                  </button>

                  {selectedDayNum < selectedProgram.durationDays && (
                    <button
                      type="button"
                      onClick={() => handleSaveDay(selectedProgram, true)}
                      disabled={savingDay}
                      className="px-5 py-2.5 rounded-2xl chrome-button text-[11px] font-medium flex items-center gap-1.5 whitespace-nowrap"
                    >
                      {savingDay ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      ) : (
                        <>
                          <span>Save & Next Day</span>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  })()}

        {/* ================================================================= */}
        {/* VIEW 2: MEMBERS                                                   */}
        {/* ================================================================= */}
        {activeMenu === "members" && (
          <div className="space-y-6">
            {/* Search & Filter Widget */}
            <div className="glass-panel rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => {
                    setMemberSearch(e.target.value);
                    setMemberPage(1);
                  }}
                  placeholder="Search customers by name, email, or phone..."
                  className="w-full pl-9 pr-4 py-2 rounded-2xl glass-input text-xs"
                />
              </div>

              <div className="flex items-center gap-1 p-1 rounded-2xl glass-panel-subtle w-fit">
                {(["ALL", "ACTIVE", "PENDING"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => {
                      setMemberFilter(f);
                      setMemberPage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-[11px] font-medium transition whitespace-nowrap ${
                      memberFilter === f
                        ? "chrome-button"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    {f === "ALL" ? "All Customers" : f === "ACTIVE" ? "Active" : "Pending"}
                  </button>
                ))}
              </div>
            </div>

            {/* Customers Table Widget */}
            <div className="glass-panel rounded-3xl overflow-hidden">
              <div className="px-7 py-5 border-b border-zinc-900/[0.06] dark:border-white/10 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-800 dark:text-zinc-200">
                  Customers Directory ({filteredMembers.length})
                </h2>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                  Manage account status and platform credentials
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900/[0.06] dark:border-white/10 text-[10px] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                      <th className="py-3.5 px-7 font-semibold whitespace-nowrap">Customer</th>
                      <th className="py-3.5 px-7 font-semibold whitespace-nowrap">Phone</th>
                      <th className="py-3.5 px-7 font-semibold whitespace-nowrap">Enrolled Programs</th>
                      <th className="py-3.5 px-7 font-semibold text-right whitespace-nowrap">Account Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/[0.05] dark:divide-white/5 text-xs">
                    {paginatedMembers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-14 text-center text-xs text-zinc-500 dark:text-zinc-400"
                        >
                          No customers found.
                        </td>
                      </tr>
                    ) : (
                      paginatedMembers.map((m) => (
                        <tr
                          key={m.id}
                          className="hover:bg-white/30 dark:hover:bg-white/[0.02] transition"
                        >
                          <td className="py-4 px-7">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-zinc-900 dark:text-white whitespace-nowrap">
                                {m.fullName}
                              </span>
                              {m.status === "SUSPENDED" && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900/10 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 font-medium whitespace-nowrap">
                                  Suspended
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-500 mt-0.5">
                              {m.email}
                            </div>
                          </td>
                          <td className="py-4 px-7 text-[11px] text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                            {m.phone || "—"}
                          </td>
                          <td className="py-4 px-7">
                            {m.enrollments.length === 0 ? (
                              <span className="text-[11px] text-zinc-400">None</span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {m.enrollments.map((en) => (
                                  <span
                                    key={en.id}
                                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap ${
                                      en.status === "ACTIVE"
                                        ? "glass-panel-subtle text-zinc-900 dark:text-white"
                                        : "bg-orange-500/15 text-orange-700 dark:text-orange-300"
                                    }`}
                                  >
                                    {en.program.title}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-7 text-right">
                            {m.id !== currentAdminId && (
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleUserRole(m)}
                                  disabled={userActionLoading === m.id}
                                  className="px-2.5 py-1.5 rounded-xl glass-panel-subtle text-[11px] font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1 whitespace-nowrap"
                                  title={m.role === "SUPERADMIN" ? "Demote to Member" : "Promote to Superadmin"}
                                >
                                  <UserCheck className="w-3 h-3 shrink-0" />
                                  <span>{m.role === "SUPERADMIN" ? "Demote" : "Promote"}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleResetPassword(m)}
                                  disabled={userActionLoading === m.id}
                                  className="px-2.5 py-1.5 rounded-xl glass-panel-subtle text-[11px] font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1 whitespace-nowrap"
                                >
                                  <KeyRound className="w-3 h-3 shrink-0" />
                                  <span>Reset Pass</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleUserStatus(m)}
                                  disabled={userActionLoading === m.id}
                                  className="px-2.5 py-1.5 rounded-xl glass-panel-subtle text-[11px] font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1 whitespace-nowrap"
                                >
                                  <Ban className="w-3 h-3 shrink-0" />
                                  <span>{m.status === "ACTIVE" ? "Suspend" : "Activate"}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(m)}
                                  disabled={userActionLoading === m.id}
                                  className="p-1.5 rounded-xl glass-panel-subtle text-red-600 dark:text-red-400 hover:border-red-500/40 flex items-center gap-1"
                                  title="Delete user account"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <PaginationBar
                currentPage={safeMemberPage}
                totalPages={totalMemberPages}
                totalItems={filteredMembers.length}
                pageSize={MEMBER_PAGE_SIZE}
                onPageChange={setMemberPage}
                itemLabel="customers"
              />
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW 3: PAYMENTS                                                  */}
        {/* ================================================================= */}
        {activeMenu === "payments" && (
          <div className="space-y-6">
            {/* Search Widget */}
            <div className="glass-panel rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={qrisSearch}
                  onChange={(e) => {
                    setQrisSearch(e.target.value);
                    setQrisPage(1);
                  }}
                  placeholder="Search payments..."
                  className="w-full pl-9 pr-4 py-2 rounded-2xl glass-input text-xs"
                />
              </div>

              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                {pendingEnrollments.length} pending requests
              </span>
            </div>

            {/* Payments List Widget */}
            <div className="glass-panel rounded-3xl overflow-hidden">
              <div className="px-7 py-5 border-b border-zinc-900/[0.06] dark:border-white/10">
                <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-800 dark:text-zinc-200">
                  Pending Payments
                </h2>
              </div>

              {paginatedQris.length === 0 ? (
                <div className="p-14 text-center space-y-2">
                  <CheckCircle2 className="w-6 h-6 text-zinc-400 mx-auto" />
                  <p className="text-xs font-medium text-zinc-900 dark:text-white">
                    All caught up
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    There are no pending payments to review.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-900/[0.06] dark:divide-white/10">
                  {paginatedQris.map((item) => (
                    <div
                      key={item.id}
                      className="p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                            {item.userFullName}
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            {item.userEmail}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-700 dark:text-zinc-300">
                          {item.programTitle} •{" "}
                          <strong className="font-semibold">
                            Rp {item.amountPaid.toLocaleString("id-ID")}
                          </strong>
                        </p>
                        {item.paymentRef && (
                          <p className="text-[11px] text-zinc-400 font-mono">
                            Ref: {item.paymentRef}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApprovePayment(item.id)}
                        disabled={approvingId === item.id}
                        className="px-4 py-2.5 rounded-2xl chrome-button text-[11px] font-medium flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap"
                      >
                        {approvingId === item.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Approve Payment</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <PaginationBar
                currentPage={safeQrisPage}
                totalPages={totalQrisPages}
                totalItems={filteredQris.length}
                pageSize={QRIS_PAGE_SIZE}
                onPageChange={setQrisPage}
                itemLabel="payments"
              />
            </div>
          </div>
        )}
      </main>

      {/* ================================================================= */}
      {/* PUBLISH VALIDATION & CONFIRMATION GUARD MODAL                     */}
      {/* ================================================================= */}
      {publishModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#141418] shadow-2xl border border-zinc-200 dark:border-white/10 p-7 sm:p-9 text-zinc-900 dark:text-zinc-100">
            {publishModal.mode === "ERROR" ? (
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-600 dark:text-red-400 block">
                      Publication Guard • Incomplete
                    </span>
                    <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                      Cannot Publish Program
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      To protect paying customers and maintain strict cohort integrity, all parameters and daily routines must be 100% completed before publishing.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 space-y-2">
                  <h4 className="text-xs font-semibold text-red-800 dark:text-red-300">
                    Validation Requirements ({publishModal.errorList?.length || 0}):
                  </h4>
                  <ul className="space-y-1.5 text-xs text-red-700 dark:text-red-300">
                    {publishModal.errorList?.map((err, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-500" />
                        <span>{err}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setPublishModal(null)}
                    className="px-5 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs transition"
                  >
                    Close & Fix Issues
                  </button>

                  {publishModal.missingDays && publishModal.missingDays.length > 0 && selectedProgram && (
                    <button
                      type="button"
                      onClick={() => {
                        setPublishModal(null);
                        setProgramDetailTab("schedule");
                        handleSelectDay(selectedProgram, publishModal.missingDays![0]);
                      }}
                      className="px-6 py-2.5 rounded-2xl chrome-button text-xs font-semibold flex items-center gap-1.5"
                    >
                      <span>Fill Day {publishModal.missingDays[0]}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400 block">
                      Strict Launch Guard
                    </span>
                    <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                      Confirm Cohort Launch & Lock
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      Are you sure you want to activate and publish this program?
                    </p>
                  </div>
                </div>

                {selectedProgram && (
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/10 space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-white/10">
                      <span className="text-zinc-500">Program Title:</span>
                      <span className="font-semibold text-zinc-900 dark:text-white line-clamp-1 max-w-[200px]">
                        {selectedProgram.title}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Schedule Status:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        All {selectedProgram.durationDays} Days Complete
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Tuition Price:</span>
                      <span className="font-semibold text-zinc-900 dark:text-white">
                        Rp {selectedProgram.price.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Max Capacity:</span>
                      <span className="font-semibold text-zinc-900 dark:text-white">
                        {selectedProgram.maxQuota} Seats
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                  <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <p className="leading-relaxed">
                    <strong>Immutability Notice:</strong> Once published, Program Information and pricing will be locked to prevent discrepancies with what customers paid for.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setPublishModal(null)}
                    className="px-5 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={publishingId === selectedProgram?.id}
                    onClick={() => {
                      if (selectedProgram) handleTogglePublish(selectedProgram, true);
                    }}
                    className="px-6 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition flex items-center gap-2 shadow-md disabled:opacity-60"
                  >
                    {publishingId === selectedProgram?.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-3.5 h-3.5" />
                        <span>Confirm & Launch Program</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
