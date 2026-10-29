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
  wellnessAdminSetProgramStatus,
} from "@/wellness/actions/program";
import {
  wellnessCreateMasterCoach,
  wellnessUpdateMasterCoach,
  wellnessDeleteMasterCoach,
  wellnessCreateMasterTargetAudience,
  wellnessUpdateMasterTargetAudience,
  wellnessDeleteMasterTargetAudience,
  wellnessCreateMasterCategory,
  wellnessUpdateMasterCategory,
  wellnessDeleteMasterCategory,
  wellnessCreateMasterEquipment,
  wellnessUpdateMasterEquipment,
  wellnessDeleteMasterEquipment,
  wellnessCreateMasterDailyCommitment,
  wellnessUpdateMasterDailyCommitment,
  wellnessDeleteMasterDailyCommitment,
  MasterDataPayload,
} from "@/wellness/actions/master";
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
  Moon,
  QrCode,
  Plus,
  Pencil,
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
  Bell,
  Clock,
  Eye,
  ImageIcon,
  EyeOff,
} from "lucide-react";

export interface DayNotificationState {
  time: string;
  message: string;
  label?: string;
}

export function getDefaultNotificationsForType(dayType: string): DayNotificationState[] {
  if (dayType === "REST_DAY") {
    return [
      {
        time: "08:00",
        label: "Morning • Active Restoration",
        message: "Today is a Rest Day. Take a 20-minute gentle outdoor walk, hydrate, and allow your nervous system to recharge.",
      },
      {
        time: "20:30",
        label: "Evening • Recovery Diary & Sleep",
        message: "Log your restorative insights in Dear Diary and align your sleep environment for deep cellular recovery.",
      },
    ];
  }
  if (dayType === "CONNECTION_DAY" || dayType === "MEETUP_DAY") {
    return [
      {
        time: "08:30",
        label: "Morning • Live Studio / Zoom Circle",
        message: "Live Community Circle begins today. Check the studio directions or virtual link on your program dashboard.",
      },
      {
        time: "13:00",
        label: "Afternoon • Community Reflection",
        message: "Thank you for connecting! Nourish mindfully and log your nutrition compliance for today.",
      },
      {
        time: "20:30",
        label: "Evening • Gratitude & Sleep Track",
        message: "Record your shared insights in Dear Diary and commit to your target bedtime schedule.",
      },
    ];
  }
  return [
    {
      time: "07:00",
      label: "Morning • Movement Ritual",
      message: "Today's movement sequence is live. Dedicate 25 minutes for practice and capture your before/after check-in.",
    },
    {
      time: "12:30",
      label: "Afternoon • Clean Nourishment",
      message: "Time for mindful midday fuel. Review your coach's meal protocol and log your dietary compliance.",
    },
    {
      time: "20:30",
      label: "Evening • Dear Diary & Cutoff",
      message: "Complete your daily Dear Diary, rate your fulfillment index, and finalize logs prior to the 23:59 cutoff.",
    },
  ];
}

function formatDate(dateVal?: Date | string | null): string {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export interface AdminProgramDay {
  id: string;
  dayNumber: number;
  title: string;
  dayType: string;
  workoutOptions?: string[];
  sleepRecommendation?: string | null;
  dayNotifications?: DayNotificationState[];
  videoUrl: string | null;
  videoChecklist: string[];
  mealRecommendation: string | null;
  dailyAssessment: string | null;
  pendingReminder: string | null;
  completedReminder: string | null;
  meetupLink: string | null;
  mapLink?: string | null;
  onsiteVenue: string | null;
  onsiteSchedule: string | null;
  eventTitle?: string | null;
  eventHost?: string | null;
  eventDetails?: string | null;
  restInstructions: string | null;
  coachName?: string | null;
  recommendedFor?: string | null;
}

export interface AdminProgram {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage?: string | null;
  difficultyLevel?: string | null;
  category?: string | null;
  equipment?: string | null;
  dailyCommitment?: string | null;
  recommendedFor: string;
  coachName: string;
  coachTitle?: string | null;
  durationDays: number;
  actualPrice?: number;
  discountPercentage?: number;
  price: number;
  maxQuota: number;
  communityLink: string | null;
  locationType?: string | null;
  city?: string | null;
  venueAddress?: string | null;
  virtualFallbackAvailable?: boolean | null;
  startDate: Date | string;
  endDate: Date | string;
  registrationOpenDate?: Date | string | null;
  registrationDeadline: Date | string;
  status?: string;
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
  initialMasterData: MasterDataPayload;
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
  if (day.dayType === "CONNECTION_DAY" || day.dayType === "MEETUP_DAY") {
    return Boolean(
      (day.onsiteVenue && day.onsiteVenue.trim().length > 0) ||
        (day.onsiteSchedule && day.onsiteSchedule.trim().length > 0) ||
        (day.meetupLink && day.meetupLink.trim().length > 0)
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

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-medium text-zinc-700 dark:text-zinc-300 disabled:opacity-35 flex items-center gap-1 whitespace-nowrap transition"
        >
          <ChevronLeft className="w-3.5 h-3.5 shrink-0" /> Prev
        </button>

        <span className="px-2 text-xs font-mono text-zinc-500 whitespace-nowrap">
          {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-medium text-zinc-700 dark:text-zinc-300 disabled:opacity-35 flex items-center gap-1 whitespace-nowrap transition"
        >
          Next <ChevronRight className="w-3.5 h-3.5 shrink-0" />
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

function toggleTagInList(tag: string, currentVal: string): string {
  const currentTags = parseTagList(currentVal);
  const exists = currentTags.some((t) => t.toLowerCase() === tag.toLowerCase());
  const nextTags = exists
    ? currentTags.filter((t) => t.toLowerCase() !== tag.toLowerCase())
    : [...currentTags, tag];
  return stringifyTagList(nextTags);
}

export const DIFFICULTY_LEVELS = [
  { value: "BEGINNER", label: "Beginner", description: "Foundational & gentle pace" },
  { value: "MODERATE", label: "Moderate", description: "Accessible steady rhythm" },
  { value: "INTERMEDIATE", label: "Intermediate", description: "Balanced endurance & technique" },
  { value: "ADVANCED", label: "Advanced", description: "High progression & load" },
  { value: "HIGH_INTENSITY", label: "High Intensity", description: "Maximum demand & athletic push" },
] as const;

interface DropdownTagPickerProps {
  label: string;
  subLabel?: string;
  value: string;
  onChange: (newValue: string) => void;
  disabled?: boolean;
  options: Array<{ id: string; name: string; title?: string | null }>;
  selectPlaceholder?: string;
  onManage?: () => void;
  manageLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

function DropdownTagPicker({
  label,
  subLabel,
  value,
  onChange,
  disabled = false,
  options = [],
  selectPlaceholder = "Select from directory...",
  onManage,
  manageLabel = "+ Manage in Directory",
  icon: Icon,
}: DropdownTagPickerProps) {
  const tags = parseTagList(value);

  const addTag = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      const next = [...tags, trimmed];
      onChange(stringifyTagList(next));
    }
  };

  const removeTag = (indexToRemove: number) => {
    if (disabled) return;
    const next = tags.filter((_, idx) => idx !== indexToRemove);
    onChange(stringifyTagList(next));
  };

  const availableOptions = options.filter(
    (opt) => !tags.some((t) => t.toLowerCase() === opt.name.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />}
          <span>{label}</span>
          <span className="text-[11px] text-zinc-400 font-normal">
            ({tags.length} selected)
          </span>
        </label>
        <div className="flex items-center gap-2">
          {subLabel && <span className="text-[10px] text-zinc-400">{subLabel}</span>}
          {onManage && !disabled && (
            <button
              type="button"
              onClick={onManage}
              className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition underline"
            >
              {manageLabel}
            </button>
          )}
        </div>
      </div>

      {!disabled && (
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) {
              addTag(e.target.value);
            }
          }}
          className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
        >
          <option value="">+ {selectPlaceholder}</option>
          {availableOptions.map((opt) => (
            <option key={opt.id} value={opt.name} className="bg-white dark:bg-zinc-900">
              {opt.name} {opt.title ? `(${opt.title})` : ""}
            </option>
          ))}
        </select>
      )}

      {/* Badges Display */}
      <div className="min-h-[38px] p-2 rounded-xl bg-zinc-50/70 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/10 flex flex-wrap items-center gap-1.5">
        {tags.length === 0 ? (
          <span className="text-[11px] text-zinc-400 italic px-1">
            None selected yet. Select from the directory dropdown above.
          </span>
        ) : (
          tags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/10 shadow-2xs"
            >
              <span>{tag}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(idx)}
                  className="hover:opacity-70 rounded-full p-0.5 text-zinc-400 hover:text-red-500 transition"
                  title={`Remove ${tag}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

interface SingleSelectDirectoryPickerProps {
  label: string;
  subLabel?: string;
  value: string;
  onChange: (val: string) => void;
  options: Array<{ id: string; name: string }>;
  disabled?: boolean;
  onManage?: () => void;
  manageLabel?: string;
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

function SingleSelectDirectoryPicker({
  label,
  subLabel,
  value,
  onChange,
  options = [],
  disabled = false,
  onManage,
  manageLabel = "+ Manage in Directory",
  placeholder = "Select from directory...",
  icon: Icon,
}: SingleSelectDirectoryPickerProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />}
          <span>{label}</span>
        </label>
        <div className="flex items-center gap-2">
          {subLabel && <span className="text-[10px] text-zinc-400">{subLabel}</span>}
          {onManage && !disabled && (
            <button
              type="button"
              onClick={onManage}
              className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition underline"
            >
              {manageLabel}
            </button>
          )}
        </div>
      </div>
      <select
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-zinc-400"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.name} className="bg-white dark:bg-zinc-900">
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  );
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
  chipColor?: "zinc" | "chrome";
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
        className={`min-h-[42px] p-2 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex flex-wrap items-center gap-1.5 ${
          disabled ? "opacity-60 cursor-not-allowed" : ""
        }`}
      >
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
              chipColor === "chrome"
                ? "bg-zinc-200 dark:bg-white/15 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-white/20"
                : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-200 dark:border-white/10 shadow-xs"
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
                className="px-2.5 py-1 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-[10px] font-semibold shrink-0 shadow-2xs hover:opacity-90 transition"
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
  initialMasterData,
  currentAdminId,
}: AdminClientProps) {
  const router = useRouter();

  const [activeMenu, setActiveMenu] = useState<
    "dashboard" | "programs" | "master" | "members" | "payments"
  >("dashboard");

  const [users, setUsers] = useState<AdminUserItem[]>(initialUsers);
  const [programs, setPrograms] = useState<AdminProgram[]>(initialPrograms);
  const [masterData, setMasterData] = useState<MasterDataPayload>(
    initialMasterData || { coaches: [], targetAudiences: [], categories: [] }
  );
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [isCreatingProgram, setIsCreatingProgram] = useState(false);

  // Master Data form inputs
  const [newCoachName, setNewCoachName] = useState("");
  const [newCoachTitle, setNewCoachTitle] = useState("");
  const [newAudienceName, setNewAudienceName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newEquipmentName, setNewEquipmentName] = useState("");
  const [newCommitmentName, setNewCommitmentName] = useState("");
  const [masterActionLoading, setMasterActionLoading] = useState(false);

  // Master Directories View State & Pagination
  const [masterTab, setMasterTab] = useState<"all" | "coaches" | "audience" | "categories" | "equipment" | "commitments">("all");
  const [masterSearch, setMasterSearch] = useState("");
  const [coachPage, setCoachPage] = useState(1);
  const [audiencePage, setAudiencePage] = useState(1);
  const [categoryPage, setCategoryPage] = useState(1);
  const [equipmentPage, setEquipmentPage] = useState(1);
  const [commitmentPage, setCommitmentPage] = useState(1);
  const MASTER_PAGE_SIZE = 5;

  const [showAddCoach, setShowAddCoach] = useState(false);
  const [editingCoach, setEditingCoach] = useState<{ id: string; name: string; title: string } | null>(null);

  const [showAddAudience, setShowAddAudience] = useState(false);
  const [editingAudience, setEditingAudience] = useState<{ id: string; name: string } | null>(null);

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);

  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<{ id: string; name: string } | null>(null);

  const [showAddCommitment, setShowAddCommitment] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState<{ id: string; name: string } | null>(null);

  const navigateToDirectory = (
    tab: "coaches" | "audience" | "categories" | "equipment" | "commitments"
  ) => {
    setActiveMenu("master");
    setMasterTab(tab);
    if (tab === "coaches") {
      setShowAddCoach(true);
      setEditingCoach(null);
    } else if (tab === "audience") {
      setShowAddAudience(true);
      setEditingAudience(null);
    } else if (tab === "categories") {
      setShowAddCategory(true);
      setEditingCategory(null);
    } else if (tab === "equipment") {
      setShowAddEquipment(true);
      setEditingEquipment(null);
    } else if (tab === "commitments") {
      setShowAddCommitment(true);
      setEditingCommitment(null);
    }
  };

  const defaultStart = new Date(Date.now() + 3 * 24 * 3600 * 1000)
    .toISOString()
    .split("T")[0];
  const defaultDeadline = new Date(Date.now() + 2 * 24 * 3600 * 1000)
    .toISOString()
    .split("T")[0];

  const initialCoach = masterData.coaches[0] || {
    name: "Coach Marcus Vance",
    title: "Movement & Longevity Specialist",
  };
  const initialCategory = masterData.categories[0]?.name || "Pilates";
  const initialEquipment = (masterData.equipment && masterData.equipment[0]?.name) || "Yoga Mat";
  const initialCommitment = (masterData.dailyCommitments && masterData.dailyCommitments[0]?.name) || "20 - 30 Mins / Day";

  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    coverImage: "",
    difficultyLevel: "INTERMEDIATE",
    category: initialCategory,
    equipment: initialEquipment,
    dailyCommitment: initialCommitment,
    coachName: initialCoach.name,
    coachTitle: initialCoach.title,
    recommendedFor: "Desk Workers, Sedentary Professionals",
    durationDays: 7,
    startDate: defaultStart,
    endDate: computeEndDate(defaultStart, 7),
    registrationOpenDate: "",
    isTbaOpenDate: false,
    registrationDeadline: defaultDeadline,
    actualPrice: 350000,
    discountPercentage: 0,
    price: 350000,
    maxQuota: 35,
    communityLink: "",
    locationType: "ONLINE" as "ONLINE" | "ONSITE" | "HYBRID",
    city: "",
    venueAddress: "",
    virtualFallbackAvailable: true,
    status: "DRAFT" as "DRAFT" | "PUBLISHED",
  });
  const [creatingLoading, setCreatingLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);

  const [programSearch, setProgramSearch] = useState("");
  const [programFilter, setProgramFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
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

  const [metaError, setMetaError] = useState<string | null>(null);
  const [dayError, setDayError] = useState<string | null>(null);

  const selectedProgram = programs.find((p) => p.id === selectedProgramId) || null;
  const currentAdmin = users.find((u) => u.id === currentAdminId);

  const [metaForm, setMetaForm] = useState({
    title: "",
    description: "",
    coverImage: "",
    difficultyLevel: "INTERMEDIATE",
    category: "Pilates",
    equipment: "Yoga Mat",
    dailyCommitment: "20 - 30 Mins / Day",
    coachName: "",
    coachTitle: "",
    recommendedFor: "",
    durationDays: 7,
    startDate: "",
    endDate: "",
    registrationOpenDate: "",
    isTbaOpenDate: false,
    registrationDeadline: "",
    actualPrice: 0,
    discountPercentage: 0,
    price: 0,
    maxQuota: 35,
    communityLink: "",
    locationType: "ONLINE" as "ONLINE" | "ONSITE" | "HYBRID",
    city: "",
    venueAddress: "",
    virtualFallbackAvailable: true,
    status: "DRAFT" as "DRAFT" | "PUBLISHED",
  });

  const [dayForm, setDayForm] = useState<{
    title: string;
    dayType: "TRAINING_DAY" | "REST_DAY" | "CONNECTION_DAY" | "MEETUP_DAY";
    coachName: string;
    recommendedFor: string;
    videoUrl: string;
    videoChecklist: string[];
    mealRecommendation: string;
    dailyAssessment: string;
    workoutOptions: string[];
    sleepRecommendation: string;
    dayNotifications: DayNotificationState[];
    restInstructions: string;
    onsiteVenue: string;
    onsiteSchedule: string;
    meetupLink: string;
    mapLink: string;
    eventTitle: string;
    eventHost: string;
    eventDetails: string;
    pendingReminder: string;
    completedReminder: string;
  }>({
    title: "",
    dayType: "TRAINING_DAY",
    coachName: "",
    recommendedFor: "",
    workoutOptions: [
      "Hot Pilates",
      "Strength Workout",
      "Outdoor Running",
      "Yoga & Mobility Flow",
      "Cardio / HIIT",
    ],
    sleepRecommendation: "Target 8 Hours • Wind down before 22:30",
    dayNotifications: getDefaultNotificationsForType("TRAINING_DAY"),
    videoUrl: "",
    videoChecklist: ["Push-ups = 30 reps", "Sit-ups = 50 reps", "Pull-ups = 10 reps"],
    mealRecommendation: "",
    dailyAssessment: "",
    restInstructions: "",
    onsiteVenue: "",
    onsiteSchedule: "",
    meetupLink: "",
    mapLink: "",
    eventTitle: "",
    eventHost: "",
    eventDetails: "",
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
          : existing.dayType === "CONNECTION_DAY" || existing.dayType === "MEETUP_DAY"
          ? "CONNECTION_DAY"
          : "TRAINING_DAY";

      setDayForm({
        title: existing.title,
        dayType: normalizedType,
        coachName: existing.coachName || (progCoaches[0] || ""),
        recommendedFor: existing.recommendedFor || (progRecommended[0] || ""),
        workoutOptions:
          existing.workoutOptions && existing.workoutOptions.length > 0
            ? existing.workoutOptions
            : [
                "Hot Pilates",
                "Strength Workout",
                "Outdoor Running",
                "Yoga & Mobility Flow",
                "Cardio / HIIT",
              ],
        sleepRecommendation:
          existing.sleepRecommendation || "Target 8 Hours • Wind down before 22:30",
        dayNotifications:
          existing.dayNotifications && existing.dayNotifications.length > 0
            ? existing.dayNotifications
            : getDefaultNotificationsForType(normalizedType),
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
        mapLink: existing.mapLink || "",
        eventTitle: existing.eventTitle || "",
        eventHost: existing.eventHost || "",
        eventDetails: existing.eventDetails || "",
        pendingReminder: existing.pendingReminder || "",
        completedReminder: existing.completedReminder || "",
      });
    } else {
      setDayForm({
        title: `Day ${dayNumber}: Daily Session`,
        dayType: "TRAINING_DAY",
        coachName: progCoaches[0] || "",
        recommendedFor: progRecommended[0] || "",
        workoutOptions: [
          "Hot Pilates",
          "Strength Workout",
          "Outdoor Running",
          "Yoga & Mobility Flow",
          "Cardio / HIIT",
        ],
        sleepRecommendation: "Target 8 Hours • Wind down before 22:30",
        dayNotifications: getDefaultNotificationsForType("TRAINING_DAY"),
        videoUrl: "https://www.youtube.com/watch?v=sTANio_2E0Q",
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
        mapLink: "",
        eventTitle: "",
        eventHost: "",
        eventDetails: "",
        pendingReminder: `Day ${dayNumber} is ready. Complete your session before 23:59.`,
        completedReminder: `Well done on completing Day ${dayNumber}! Rest well tonight.`,
      });
    }
  };

  const loadMetaIntoForm = (prog: AdminProgram) => {
    setMetaForm({
      title: prog.title,
      description: prog.description,
      coverImage: prog.coverImage || "",
      difficultyLevel: prog.difficultyLevel || "INTERMEDIATE",
      category: prog.category || "Pilates",
      equipment: prog.equipment || "Yoga Mat",
      dailyCommitment: prog.dailyCommitment || "20 - 30 Mins / Day",
      coachName: prog.coachName,
      coachTitle: prog.coachTitle || "",
      recommendedFor: prog.recommendedFor || "All Levels",
      durationDays: prog.durationDays || 7,
      actualPrice: prog.actualPrice ?? prog.price,
      discountPercentage: prog.discountPercentage ?? 0,
      price: prog.price,
      maxQuota: prog.maxQuota,
      communityLink: prog.communityLink || "",
      locationType: ((prog.locationType as "ONLINE" | "ONSITE" | "HYBRID") || "ONLINE"),
      city: prog.city || "",
      venueAddress: prog.venueAddress || "",
      virtualFallbackAvailable: prog.virtualFallbackAvailable ?? true,
      startDate: toInputDate(prog.startDate),
      endDate: toInputDate(prog.endDate),
      registrationOpenDate: prog.registrationOpenDate ? toInputDate(prog.registrationOpenDate) : "",
      isTbaOpenDate: !prog.registrationOpenDate,
      registrationDeadline: toInputDate(prog.registrationDeadline),
      status: (prog.status as "DRAFT" | "PUBLISHED") || (prog.isPublished ? "PUBLISHED" : "DRAFT"),
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
    setDayError(null);

    try {
      const cleanedChecklist = dayForm.videoChecklist
        .map((item) => item.trim())
        .filter(Boolean);

      const isConnect = dayForm.dayType === "CONNECTION_DAY" || dayForm.dayType === "MEETUP_DAY";

      const res = await wellnessAdminSaveProgramDay({
        programId: prog.id,
        dayNumber: selectedDayNum,
        title: dayForm.title,
        dayType: dayForm.dayType,
        workoutOptions: dayForm.dayType === "TRAINING_DAY" ? dayForm.workoutOptions : [],
        sleepRecommendation: dayForm.sleepRecommendation,
        dayNotifications: dayForm.dayNotifications,
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
        onsiteVenue: isConnect ? dayForm.onsiteVenue : "",
        onsiteSchedule: isConnect ? dayForm.onsiteSchedule : "",
        meetupLink: isConnect ? dayForm.meetupLink : "",
        mapLink: isConnect ? dayForm.mapLink : "",
        eventTitle: isConnect ? dayForm.eventTitle : "",
        eventHost: isConnect ? dayForm.eventHost : "",
        eventDetails: isConnect ? dayForm.eventDetails : "",
        pendingReminder: dayForm.pendingReminder,
        completedReminder: dayForm.completedReminder,
      });

      if (res.success && res.data) {
        setDayError(null);
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
        const errMsg = res.message || "Unable to save day curriculum.";
        setDayError(errMsg);
        setFeedback({
          type: "error",
          text: errMsg,
        });
      }
    } catch {
      const netErr = "Network error while saving day curriculum.";
      setDayError(netErr);
      setFeedback({
        type: "error",
        text: netErr,
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
    setMetaError(null);
    try {
      const calculatedFinalPrice = Math.max(
        0,
        Math.round((Number(metaForm.actualPrice) || 0) * (1 - (Number(metaForm.discountPercentage) || 0) / 100))
      );

      const res = await wellnessAdminUpdateProgramMeta({
        programId: prog.id,
        title: metaForm.title.trim(),
        description: metaForm.description.trim(),
        coverImage: metaForm.coverImage?.trim() || undefined,
        difficultyLevel: metaForm.difficultyLevel,
        category: metaForm.category.trim(),
        equipment: metaForm.equipment?.trim() || undefined,
        dailyCommitment: metaForm.dailyCommitment?.trim() || undefined,
        coachName: metaForm.coachName.trim(),
        coachTitle: metaForm.coachTitle?.trim() || undefined,
        recommendedFor: metaForm.recommendedFor.trim(),
        durationDays: Number(metaForm.durationDays) || 7,
        actualPrice: Number(metaForm.actualPrice) || 0,
        discountPercentage: Number(metaForm.discountPercentage) || 0,
        price: calculatedFinalPrice,
        maxQuota: Number(metaForm.maxQuota) || 35,
        communityLink: metaForm.communityLink?.trim() || undefined,
        locationType: metaForm.locationType,
        city: metaForm.city.trim() || undefined,
        venueAddress: metaForm.venueAddress.trim() || undefined,
        virtualFallbackAvailable: metaForm.virtualFallbackAvailable,
        startDate: new Date(metaForm.startDate),
        endDate: new Date(metaForm.endDate),
        registrationOpenDate:
          metaForm.isTbaOpenDate || !metaForm.registrationOpenDate
            ? null
            : new Date(metaForm.registrationOpenDate),
        registrationDeadline: new Date(metaForm.registrationDeadline),
        status: metaForm.status,
      });

      if (res.success) {
        setPrograms((prev) =>
          prev.map((p) =>
            p.id === prog.id
              ? {
                  ...p,
                  title: metaForm.title,
                  description: metaForm.description,
                  coverImage: metaForm.coverImage?.trim() || null,
                  difficultyLevel: metaForm.difficultyLevel,
                  category: metaForm.category,
                  equipment: metaForm.equipment?.trim() || null,
                  dailyCommitment: metaForm.dailyCommitment?.trim() || null,
                  coachName: metaForm.coachName,
                  coachTitle: metaForm.coachTitle || null,
                  recommendedFor: metaForm.recommendedFor,
                  durationDays: Number(metaForm.durationDays) || 7,
                  actualPrice: Number(metaForm.actualPrice) || 0,
                  discountPercentage: Number(metaForm.discountPercentage) || 0,
                  price: calculatedFinalPrice,
                  maxQuota: Number(metaForm.maxQuota) || 35,
                  communityLink: metaForm.communityLink || null,
                  locationType: metaForm.locationType,
                  city: metaForm.city.trim() || null,
                  venueAddress: metaForm.venueAddress.trim() || null,
                  virtualFallbackAvailable: metaForm.virtualFallbackAvailable,
                  startDate: metaForm.startDate,
                  endDate: metaForm.endDate,
                  registrationOpenDate:
                    metaForm.isTbaOpenDate || !metaForm.registrationOpenDate
                      ? null
                      : metaForm.registrationOpenDate,
                  registrationDeadline: metaForm.registrationDeadline,
                  status: metaForm.status,
                  // If days were truncated because duration was reduced:
                  days: p.days.filter((d) => d.dayNumber <= (Number(metaForm.durationDays) || 7)),
                }
              : p
          )
        );
        setFeedback({
          type: "success",
          text: `Header information updated for "${metaForm.title}".`,
        });
        setMetaError(null);
        router.refresh();
      } else {
        const errMsg = res.message || "Unable to update program info.";
        setMetaError(errMsg);
        setFeedback({
          type: "error",
          text: errMsg,
        });
      }
    } catch {
      const netErr = "Network error while updating program info.";
      setMetaError(netErr);
      setFeedback({
        type: "error",
        text: netErr,
      });
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
      setCreateError("Please select or add at least one Coach.");
      return;
    }
    if (createForm.description.trim().length < 10) {
      setCreateError("Description must be at least 10 characters.");
      return;
    }

    setCreatingLoading(true);
    setCreateError(null);

    const calculatedFinalPrice = Math.max(
      0,
      Math.round((Number(createForm.actualPrice) || 0) * (1 - (Number(createForm.discountPercentage) || 0) / 100))
    );

    try {
      const res = await wellnessAdminCreateProgram({
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        coverImage: createForm.coverImage?.trim() || undefined,
        difficultyLevel: createForm.difficultyLevel,
        category: createForm.category?.trim() || "Pilates",
        equipment: createForm.equipment?.trim() || undefined,
        dailyCommitment: createForm.dailyCommitment?.trim() || undefined,
        coachName: createForm.coachName.trim(),
        coachTitle: createForm.coachTitle?.trim() || undefined,
        recommendedFor: createForm.recommendedFor.trim(),
        durationDays: Number(createForm.durationDays) || 7,
        actualPrice: Number(createForm.actualPrice) || 0,
        discountPercentage: Number(createForm.discountPercentage) || 0,
        price: calculatedFinalPrice,
        maxQuota: Number(createForm.maxQuota) || 35,
        communityLink: createForm.communityLink.trim() || undefined,
        locationType: createForm.locationType,
        city: createForm.city.trim() || undefined,
        venueAddress: createForm.venueAddress.trim() || undefined,
        virtualFallbackAvailable: createForm.virtualFallbackAvailable,
        startDate: new Date(createForm.startDate),
        endDate: new Date(createForm.endDate),
        registrationOpenDate:
          createForm.isTbaOpenDate || !createForm.registrationOpenDate
            ? null
            : new Date(createForm.registrationOpenDate),
        registrationDeadline: new Date(createForm.registrationDeadline),
        status: "DRAFT",
        isPublished: false,
        days: [],
      });

      if (res.success && res.data) {
        const created = res.data as any;

        const formattedNewProgram: AdminProgram = {
          id: created.id,
          title: created.title,
          slug: created.slug,
          description: created.description,
          coverImage: created.coverImage || createForm.coverImage || null,
          difficultyLevel: created.difficultyLevel || createForm.difficultyLevel || "INTERMEDIATE",
          category: created.category || createForm.category,
          equipment: created.equipment || createForm.equipment || null,
          dailyCommitment: created.dailyCommitment || createForm.dailyCommitment || null,
          recommendedFor: created.recommendedFor,
          coachName: created.coachName,
          coachTitle: created.coachTitle || createForm.coachTitle,
          durationDays: created.durationDays,
          actualPrice: created.actualPrice ?? createForm.actualPrice,
          discountPercentage: created.discountPercentage ?? createForm.discountPercentage,
          price: created.price ?? calculatedFinalPrice,
          maxQuota: created.maxQuota,
          communityLink: created.communityLink,
          locationType: created.locationType || createForm.locationType,
          city: created.city || createForm.city || null,
          venueAddress: created.venueAddress || createForm.venueAddress || null,
          virtualFallbackAvailable: created.virtualFallbackAvailable ?? createForm.virtualFallbackAvailable,
          startDate: created.startDate,
          endDate: created.endDate,
          registrationOpenDate: created.registrationOpenDate || null,
          registrationDeadline: created.registrationDeadline,
          status: "DRAFT",
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
          text: `Draft program "${formattedNewProgram.title}" created. You can now build daily routines or publish when ready.`,
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

  // Master Data action handlers
  const handleAddCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoachName.trim() || !newCoachTitle.trim()) return;
    setMasterActionLoading(true);
    try {
      const res = await wellnessCreateMasterCoach({
        name: newCoachName.trim(),
        title: newCoachTitle.trim(),
      });
      if (res.success && res.data) {
        setMasterData((prev) => ({
          ...prev,
          coaches: [...prev.coaches, res.data as any],
        }));
        setNewCoachName("");
        setNewCoachTitle("");
        setFeedback({ type: "success", text: `Coach added to master records.` });
      } else {
        setFeedback({ type: "error", text: res.message || "Failed to add coach." });
      }
    } finally {
      setMasterActionLoading(false);
    }
  };

  const handleDeleteCoach = async (id: string, name: string) => {
    if (!confirm(`Delete coach "${name}" from master records?`)) return;
    setMasterActionLoading(true);
    try {
      const res = await wellnessDeleteMasterCoach(id);
      if (res.success) {
        setMasterData((prev) => ({
          ...prev,
          coaches: prev.coaches.filter((c) => c.id !== id),
        }));
        setFeedback({ type: "success", text: `Coach "${name}" deleted.` });
      } else {
        setFeedback({ type: "error", text: res.message || "Failed to delete coach." });
      }
    } finally {
      setMasterActionLoading(false);
    }
  };

  const handleAddAudience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAudienceName.trim()) return;
    setMasterActionLoading(true);
    try {
      const res = await wellnessCreateMasterTargetAudience(newAudienceName.trim());
      if (res.success && res.data) {
        setMasterData((prev) => ({
          ...prev,
          targetAudiences: [...prev.targetAudiences, res.data as any],
        }));
        setNewAudienceName("");
        setFeedback({ type: "success", text: `Target audience added.` });
      } else {
        setFeedback({ type: "error", text: res.message || "Failed to add target audience." });
      }
    } finally {
      setMasterActionLoading(false);
    }
  };

  const handleDeleteAudience = async (id: string, name: string) => {
    setMasterActionLoading(true);
    try {
      const res = await wellnessDeleteMasterTargetAudience(id);
      if (res.success) {
        setMasterData((prev) => ({
          ...prev,
          targetAudiences: prev.targetAudiences.filter((a) => a.id !== id),
        }));
        setFeedback({ type: "success", text: `Target audience "${name}" removed.` });
      } else {
        setFeedback({ type: "error", text: res.message || "Failed to delete audience." });
      }
    } finally {
      setMasterActionLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setMasterActionLoading(true);
    try {
      const res = await wellnessCreateMasterCategory(newCategoryName.trim());
      if (res.success && res.data) {
        setMasterData((prev) => ({
          ...prev,
          categories: [...prev.categories, res.data as any],
        }));
        setNewCategoryName("");
        setFeedback({ type: "success", text: `Category added.` });
      } else {
        setFeedback({ type: "error", text: res.message || "Failed to add category." });
      }
    } finally {
      setMasterActionLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    setMasterActionLoading(true);
    try {
      const res = await wellnessDeleteMasterCategory(id);
      if (res.success) {
        setMasterData((prev) => ({
          ...prev,
          categories: prev.categories.filter((c) => c.id !== id),
        }));
        setFeedback({ type: "success", text: `Category "${name}" removed.` });
      } else {
        setFeedback({ type: "error", text: res.message || "Failed to delete category." });
      }
    } finally {
      setMasterActionLoading(false);
    }
  };

  const handleUpdateCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoach || !editingCoach.name.trim() || !editingCoach.title.trim()) return;
    setMasterActionLoading(true);
    try {
      const res = await wellnessUpdateMasterCoach({
        id: editingCoach.id,
        name: editingCoach.name.trim(),
        title: editingCoach.title.trim(),
      });
      if (res.success && res.data) {
        setMasterData((prev) => ({
          ...prev,
          coaches: prev.coaches.map((c) =>
            c.id === editingCoach.id ? (res.data as any) : c
          ),
        }));
        setEditingCoach(null);
        setFeedback({ type: "success", text: `Coach updated.` });
      } else {
        setFeedback({ type: "error", text: res.message || "Failed to update coach." });
      }
    } finally {
      setMasterActionLoading(false);
    }
  };

  const handleUpdateAudience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAudience || !editingAudience.name.trim()) return;
    setMasterActionLoading(true);
    try {
      const res = await wellnessUpdateMasterTargetAudience({
        id: editingAudience.id,
        name: editingAudience.name.trim(),
      });
      if (res.success && res.data) {
        setMasterData((prev) => ({
          ...prev,
          targetAudiences: prev.targetAudiences.map((a) =>
            a.id === editingAudience.id ? (res.data as any) : a
          ),
        }));
        setEditingAudience(null);
        setFeedback({ type: "success", text: `Target audience updated.` });
      } else {
        setFeedback({ type: "error", text: res.message || "Failed to update target audience." });
      }
    } finally {
      setMasterActionLoading(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name.trim()) return;
    setMasterActionLoading(true);
    try {
      const res = await wellnessUpdateMasterCategory({
        id: editingCategory.id,
        name: editingCategory.name.trim(),
      });
      if (res.success && res.data) {
        setMasterData((prev) => ({
          ...prev,
          categories: prev.categories.map((c) =>
            c.id === editingCategory.id ? (res.data as any) : c
          ),
        }));
        setEditingCategory(null);
        setFeedback({ type: "success", text: `Category updated.` });
      } else {
        setFeedback({ type: "error", text: res.message || "Failed to update category." });
      }
    } finally {
      setMasterActionLoading(false);
    }
  };

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEquipmentName.trim()) return;
    setMasterActionLoading(true);
    try {
      const res = await wellnessCreateMasterEquipment(newEquipmentName.trim());
      if (res.success && res.data) {
        setMasterData((prev) => ({
          ...prev,
          equipment: [...(prev.equipment || []), res.data as any],
        }));
        setNewEquipmentName("");
        setFeedback({ type: "success", text: `Equipment item added.` });
      } else {
        setFeedback({ type: "error", text: res.message || "Failed to add equipment." });
      }
    } finally {
      setMasterActionLoading(false);
    }
  };

  const handleDeleteEquipment = async (id: string, name: string) => {
    if (!confirm(`Delete equipment "${name}" from master records?`)) return;
    setMasterActionLoading(true);
    try {
      const res = await wellnessDeleteMasterEquipment(id);
      if (res.success) {
        setMasterData((prev) => ({
          ...prev,
          equipment: (prev.equipment || []).filter((e) => e.id !== id),
        }));
        setFeedback({ type: "success", text: `Equipment "${name}" removed.` });
      } else {
        setFeedback({ type: "error", text: res.message || "Failed to delete equipment." });
      }
    } finally {
      setMasterActionLoading(false);
    }
  };

  const handleUpdateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEquipment || !editingEquipment.name.trim()) return;
    setMasterActionLoading(true);
    try {
      const res = await wellnessUpdateMasterEquipment({
        id: editingEquipment.id,
        name: editingEquipment.name.trim(),
      });
      if (res.success && res.data) {
        setMasterData((prev) => ({
          ...prev,
          equipment: (prev.equipment || []).map((e) =>
            e.id === editingEquipment.id ? (res.data as any) : e
          ),
        }));
        setEditingEquipment(null);
        setFeedback({ type: "success", text: `Equipment updated.` });
      } else {
        setFeedback({ type: "error", text: res.message || "Failed to update equipment." });
      }
    } finally {
      setMasterActionLoading(false);
    }
  };

  const handleAddCommitment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommitmentName.trim()) return;
    setMasterActionLoading(true);
    try {
      const res = await wellnessCreateMasterDailyCommitment(newCommitmentName.trim());
      if (res.success && res.data) {
        setMasterData((prev) => ({
          ...prev,
          dailyCommitments: [...(prev.dailyCommitments || []), res.data as any],
        }));
        setNewCommitmentName("");
        setFeedback({ type: "success", text: `Daily commitment option added.` });
      } else {
        setFeedback({ type: "error", text: res.message || "Failed to add commitment." });
      }
    } finally {
      setMasterActionLoading(false);
    }
  };

  const handleDeleteCommitment = async (id: string, name: string) => {
    if (!confirm(`Delete daily commitment "${name}" from master records?`)) return;
    setMasterActionLoading(true);
    try {
      const res = await wellnessDeleteMasterDailyCommitment(id);
      if (res.success) {
        setMasterData((prev) => ({
          ...prev,
          dailyCommitments: (prev.dailyCommitments || []).filter((c) => c.id !== id),
        }));
        setFeedback({ type: "success", text: `Daily commitment "${name}" removed.` });
      } else {
        setFeedback({ type: "error", text: res.message || "Failed to delete commitment." });
      }
    } finally {
      setMasterActionLoading(false);
    }
  };

  const handleUpdateCommitment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommitment || !editingCommitment.name.trim()) return;
    setMasterActionLoading(true);
    try {
      const res = await wellnessUpdateMasterDailyCommitment({
        id: editingCommitment.id,
        name: editingCommitment.name.trim(),
      });
      if (res.success && res.data) {
        setMasterData((prev) => ({
          ...prev,
          dailyCommitments: (prev.dailyCommitments || []).map((c) =>
            c.id === editingCommitment.id ? (res.data as any) : c
          ),
        }));
        setEditingCommitment(null);
        setFeedback({ type: "success", text: `Daily commitment updated.` });
      } else {
        setFeedback({ type: "error", text: res.message || "Failed to update commitment." });
      }
    } finally {
      setMasterActionLoading(false);
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
      errors.push("At least one Coach is required.");
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
      errors.push("Program dates must be valid calendar dates.");
    } else {
      if (deadlineTs > startTs) {
        errors.push("Registration cutoff date cannot be after the program start date.");
      }
      if (endTs <= startTs) {
        errors.push("Program end date must be after the start date.");
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

  const handleSetProgramStatus = async (
    progId: string,
    newStatus: "NOT_SHOW" | "COMING_SOON" | "ACTIVE"
  ) => {
    setPublishingId(progId);
    setFeedback(null);
    try {
      const res = await wellnessAdminSetProgramStatus(progId, newStatus);
      if (res.success && res.data) {
        setPrograms((prev) =>
          prev.map((p) =>
            p.id === progId
              ? {
                  ...p,
                  status: res.data!.status as "NOT_SHOW" | "COMING_SOON" | "ACTIVE",
                  isPublished: res.data!.isPublished,
                }
              : p
          )
        );
        setFeedback({
          type: "success",
          text: res.message || "Program status successfully updated.",
        });
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          text: res.message || "Failed to update program status.",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "An unexpected system error occurred while updating status.",
      });
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
    if (programFilter === "PUBLISHED") return p.isPublished;
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
    <div className="min-h-screen flex flex-col lg:flex-row text-xs font-sans selection:bg-zinc-800 selection:text-white bg-zinc-50/60 dark:bg-zinc-950">
      {/* ================================================================= */}
      {/* STICKY MINIMALIST SIDEBAR                                         */}
      {/* ================================================================= */}
      <aside className="w-full lg:w-64 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b lg:border-b-0 lg:border-r border-zinc-200/80 dark:border-white/10 flex flex-col justify-between p-6 z-30">
        <div className="space-y-7">
          {/* Brand Header */}
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Link href="/" className="group">
                  <h1 className="font-geometric font-extralight text-sm tracking-[0.34em] text-zinc-900 dark:text-white uppercase">
                    BMS
                  </h1>
                </Link>
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                  Console
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate font-normal">
                {currentAdmin?.fullName || "Sanctuary Admin"}
              </p>
            </div>
            <ThemeToggle />
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setActiveMenu("dashboard");
                setSelectedProgramId(null);
                setIsCreatingProgram(false);
                setFeedback(null);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                activeMenu === "dashboard"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Dashboard</span>
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
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                activeMenu === "programs"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 shrink-0" />
                <span>Programs</span>
              </span>
              <span className="text-[11px] font-mono opacity-70">{programs.length}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMenu("master");
                setSelectedProgramId(null);
                setIsCreatingProgram(false);
                setFeedback(null);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                activeMenu === "master"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Tag className="w-4 h-4 shrink-0" />
                <span>Directories</span>
              </span>
              <span className="text-[11px] font-mono opacity-70">
                {masterData.coaches.length + masterData.targetAudiences.length + masterData.categories.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMenu("members");
                setSelectedProgramId(null);
                setIsCreatingProgram(false);
                setFeedback(null);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                activeMenu === "members"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Users className="w-4 h-4 shrink-0" />
                <span>Customers</span>
              </span>
              <span className="text-[11px] font-mono opacity-70">{users.length}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMenu("payments");
                setSelectedProgramId(null);
                setIsCreatingProgram(false);
                setFeedback(null);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                activeMenu === "payments"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <QrCode className="w-4 h-4 shrink-0" />
                <span>Payments</span>
              </span>
              {pendingEnrollments.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-zinc-200 dark:bg-white/20 text-zinc-900 dark:text-white">
                  {pendingEnrollments.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-zinc-200/80 dark:border-white/10 space-y-1">
          <Link
            href="/dashboard"
            className="w-full px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 flex items-center justify-between transition"
          >
            <span>Member View</span>
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 flex items-center gap-2 transition"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ================================================================= */}
      {/* MAIN WORKSPACE                                                    */}
      {/* ================================================================= */}
      <main className="flex-1 min-w-0 p-6 sm:p-8 lg:p-10 max-w-6xl mx-auto w-full space-y-8">
        {/* CONTEXTUAL TOP WIDGETS (2 per row for generous negative space) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {activeMenu === "dashboard" && (
            <>
              <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-5 sm:p-6 border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between min-w-0">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block truncate">
                  Total Programs
                </span>
                <div className="text-2xl sm:text-3xl font-geometric font-light tracking-tight text-zinc-900 dark:text-white my-1">
                  {programs.length}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  {liveProgramsCount} published • {draftProgramsCount} drafts
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-5 sm:p-6 border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between min-w-0">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block truncate">
                  Total Customers
                </span>
                <div className="text-2xl sm:text-3xl font-geometric font-light tracking-tight text-zinc-900 dark:text-white my-1">
                  {users.length}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  {activeUsersCount} active • {suspendedUsersCount} suspended
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-5 sm:p-6 border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between min-w-0">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block truncate">
                  Pending Approvals
                </span>
                <div className="text-2xl sm:text-3xl font-geometric font-light tracking-tight text-zinc-900 dark:text-white my-1">
                  {pendingEnrollments.length}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal font-mono">
                  Rp {pendingRevenue.toLocaleString("id-ID")} pending
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-5 sm:p-6 border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between min-w-0">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block truncate">
                  Verified Revenue
                </span>
                <div className="text-2xl sm:text-3xl font-geometric font-light tracking-tight text-zinc-900 dark:text-white font-mono my-1 truncate">
                  Rp {approvedRevenue.toLocaleString("id-ID")}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  {approvedEnrollments.length} enrolled members
                </p>
              </div>
            </>
          )}

          {activeMenu === "programs" && (
            <>
              <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-5 sm:p-6 border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between min-w-0">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block truncate">
                  Total Programs
                </span>
                <div className="text-2xl sm:text-3xl font-geometric font-light tracking-tight text-zinc-900 dark:text-white my-1">
                  {programs.length}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  Catalog total
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-5 sm:p-6 border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between min-w-0">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block truncate">
                  Published Programs
                </span>
                <div className="text-2xl sm:text-3xl font-geometric font-light tracking-tight text-zinc-900 dark:text-white my-1">
                  {liveProgramsCount}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  Live &amp; open
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-5 sm:p-6 border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between min-w-0">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block truncate">
                  Draft Programs
                </span>
                <div className="text-2xl sm:text-3xl font-geometric font-light tracking-tight text-zinc-900 dark:text-zinc-400 my-1">
                  {draftProgramsCount}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  In preparation
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-5 sm:p-6 border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between min-w-0">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block truncate">
                  Curriculum Ready
                </span>
                <div className="text-2xl sm:text-3xl font-geometric font-light tracking-tight text-zinc-900 dark:text-white my-1">
                  {curriculumReadyCount}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  {programs.length > 0 ? Math.round((curriculumReadyCount / programs.length) * 100) : 0}% completed
                </p>
              </div>
            </>
          )}

          {activeMenu === "master" && (
            <>
              <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-5 sm:p-6 border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between min-w-0">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block truncate">
                  Master Coaches
                </span>
                <div className="text-2xl sm:text-3xl font-geometric font-light tracking-tight text-zinc-900 dark:text-white my-1">
                  {masterData.coaches.length}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  Instructor profiles
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-5 sm:p-6 border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between min-w-0">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block truncate">
                  Target Audiences
                </span>
                <div className="text-2xl sm:text-3xl font-geometric font-light tracking-tight text-zinc-900 dark:text-white my-1">
                  {masterData.targetAudiences.length}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  Audience personas
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-5 sm:p-6 border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between min-w-0">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block truncate">
                  Categories
                </span>
                <div className="text-2xl sm:text-3xl font-geometric font-light tracking-tight text-zinc-900 dark:text-white my-1">
                  {masterData.categories.length}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  Program taxonomies
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-5 sm:p-6 border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between min-w-0">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block truncate">
                  Active Programs
                </span>
                <div className="text-2xl sm:text-3xl font-geometric font-light tracking-tight text-zinc-900 dark:text-white my-1">
                  {programs.length}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  Linked programs
                </p>
              </div>
            </>
          )}

          {activeMenu === "members" && (
            <>
              <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-5 sm:p-6 border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between min-w-0">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block truncate">
                  Total Customers
                </span>
                <div className="text-2xl sm:text-3xl font-geometric font-light tracking-tight text-zinc-900 dark:text-white my-1">
                  {users.length}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  Registered accounts
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-5 sm:p-6 border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between min-w-0">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block truncate">
                  Active Standing
                </span>
                <div className="text-2xl sm:text-3xl font-geometric font-light tracking-tight text-zinc-900 dark:text-zinc-100 my-1">
                  {activeUsersCount}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  Full platform access
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-5 sm:p-6 border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between min-w-0">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block truncate">
                  Suspended Accounts
                </span>
                <div className="text-2xl sm:text-3xl font-geometric font-light tracking-tight text-zinc-400 my-1">
                  {suspendedUsersCount}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  Access restricted
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-5 sm:p-6 border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between min-w-0">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block truncate">
                  Enrolled Customers
                </span>
                <div className="text-2xl sm:text-3xl font-geometric font-light tracking-tight text-zinc-900 dark:text-white my-1">
                  {enrolledUsersCount}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  Active enrolled
                </p>
              </div>
            </>
          )}

          {activeMenu === "payments" && (
            <>
              <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-5 sm:p-6 border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between min-w-0">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block truncate">
                  Pending Approvals
                </span>
                <div className="text-2xl sm:text-3xl font-geometric font-light tracking-tight text-zinc-900 dark:text-white my-1">
                  {pendingEnrollments.length}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  Awaiting review
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-5 sm:p-6 border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between min-w-0">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block truncate">
                  Approved Orders
                </span>
                <div className="text-2xl sm:text-3xl font-geometric font-light tracking-tight text-zinc-900 dark:text-white my-1">
                  {approvedEnrollments.length}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  Verified payments
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-5 sm:p-6 border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between min-w-0">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block truncate">
                  Settled Revenue
                </span>
                <div className="text-2xl sm:text-3xl font-geometric font-light tracking-tight text-zinc-900 dark:text-white font-mono my-1 truncate">
                  Rp {approvedRevenue.toLocaleString("id-ID")}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  Tuition collected
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-5 sm:p-6 border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between min-w-0">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block truncate">
                  Pending Volume
                </span>
                <div className="text-2xl sm:text-3xl font-geometric font-light tracking-tight text-zinc-500 dark:text-zinc-400 font-mono my-1 truncate">
                  Rp {pendingRevenue.toLocaleString("id-ID")}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  Unverified balance
                </p>
              </div>
            </>
          )}
        </section>

        {/* Feedback Banner */}
        {feedback && (
          <div className="bg-white dark:bg-zinc-900/90 rounded-2xl px-5 py-3.5 text-xs flex items-center justify-between gap-3 border border-zinc-200/80 dark:border-white/10 shadow-xs">
            <span className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-zinc-800 dark:text-zinc-200 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-zinc-500 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-[11px] text-zinc-400 hover:text-zinc-900 dark:hover:text-white whitespace-nowrap"
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
            <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-6 border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 dark:text-zinc-500 block">
                  Operations Cockpit
                </span>
                <h2 className="text-xl sm:text-2xl font-geometric font-light tracking-tight text-zinc-900 dark:text-white">
                  Platform Overview
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                  Monitor live programs, verify member payments, and review customer standings in real time.
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
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium flex items-center gap-1.5 transition hover:opacity-90 shadow-xs whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span>New Program</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMenu("payments")}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/15 bg-zinc-50 dark:bg-white/5 text-zinc-800 dark:text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition hover:bg-zinc-100 dark:hover:bg-white/10 whitespace-nowrap"
                >
                  <QrCode className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                  <span>Pending Payments ({pendingEnrollments.length})</span>
                </button>
              </div>
            </div>

            {/* 2-Column Split: Programs Health & Pending Approvals */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left Column: Programs Directory Snapshot */}
              <div className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200/80 dark:border-white/10 shadow-xs overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-zinc-400" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                      Active Programs ({programs.length})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveMenu("programs")}
                    className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition flex items-center gap-1"
                  >
                    View Directory <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="divide-y divide-zinc-100 dark:divide-white/5 flex-1">
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
                          className="p-4 hover:bg-zinc-50/70 dark:hover:bg-white/[0.02] cursor-pointer transition flex items-center justify-between gap-4"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                  prog.isPublished
                                    ? "bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-white/20 font-medium"
                                    : "bg-zinc-50 text-zinc-500 border-zinc-200 dark:border-white/10"
                                }`}
                              >
                                {prog.isPublished ? "Published" : "Draft"}
                              </span>
                              <span className="text-[11px] text-zinc-500 truncate">
                                {prog.coachName}
                              </span>
                            </div>
                            <h4 className="text-xs font-medium text-zinc-900 dark:text-white truncate">
                              {prog.title}
                            </h4>
                            <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-mono">
                              <span>{filledCount}/{targetDays} days ({pct}%)</span>
                              <span>•</span>
                              <span>{prog.durationDays} Days</span>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            <span className="text-xs font-mono font-medium text-zinc-900 dark:text-white whitespace-nowrap">
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
              <div className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200/80 dark:border-white/10 shadow-xs overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-zinc-400" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                      Payment Queue ({pendingEnrollments.length})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveMenu("payments")}
                    className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition flex items-center gap-1"
                  >
                    View All <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="divide-y divide-zinc-100 dark:divide-white/5 flex-1">
                  {pendingEnrollments.length === 0 ? (
                    <div className="p-10 text-center space-y-2">
                      <CheckCircle2 className="w-6 h-6 text-zinc-300 dark:text-zinc-600 mx-auto" />
                      <p className="text-xs font-medium text-zinc-900 dark:text-white">
                        All payments verified
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Zero pending customer transactions.
                      </p>
                    </div>
                  ) : (
                    pendingEnrollments.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-50/70 dark:hover:bg-white/[0.02] transition"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                            {item.userFullName}
                          </p>
                          <p className="text-[11px] text-zinc-500 truncate">
                            {item.programTitle}
                          </p>
                          <p className="text-[11px] font-mono font-medium text-zinc-900 dark:text-white">
                            Rp {item.amountPaid.toLocaleString("id-ID")}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleApprovePayment(item.id)}
                          disabled={approvingId === item.id}
                          className="px-3.5 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-[11px] font-medium flex items-center gap-1 shrink-0 whitespace-nowrap shadow-xs hover:opacity-90 transition"
                        >
                          {approvingId === item.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-zinc-200 dark:text-zinc-800" />
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
            <div className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200/80 dark:border-white/10 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-zinc-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                    Recent Customer Accounts
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMenu("members")}
                  className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition flex items-center gap-1"
                >
                  Manage All Customers ({users.length}) <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="divide-y divide-zinc-100 dark:divide-white/5">
                {users.slice(0, 5).map((u) => (
                  <div
                    key={u.id}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-50/70 dark:hover:bg-white/[0.02] transition"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                          {u.fullName}
                        </span>
                        <span
                          className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${
                            u.status === "ACTIVE"
                              ? "bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-zinc-100"
                              : "bg-zinc-100 text-zinc-500"
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
            <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-4 border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 flex-wrap">
                  {(["ALL", "PUBLISHED", "DRAFT"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setProgramFilter(status);
                        setProgramPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition whitespace-nowrap ${
                        programFilter === status
                          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs"
                          : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                      }`}
                    >
                      {status === "ALL"
                        ? "All Programs"
                        : status === "PUBLISHED"
                        ? "Published"
                        : "Draft (Unpublished)"}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingProgram(true);
                    setSelectedProgramId(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-[11px] font-medium flex items-center gap-1.5 whitespace-nowrap shadow-xs hover:opacity-90 transition"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" /> New Program
                </button>
              </div>
            </div>

            {/* BOTTOM WIDGET: Programs List + Pagination */}
            <div className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200/80 dark:border-white/10 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between gap-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white whitespace-nowrap">
                  Programs Directory
                </h2>
                <span className="text-[11px] text-zinc-400 hidden sm:inline whitespace-nowrap">
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

                    const isDraft = !prog.isPublished;
                    const attendanceLabel =
                      prog.locationType === "ONLINE"
                        ? "Online"
                        : prog.locationType === "ONSITE"
                        ? `On-Site • ${prog.city || "Jakarta"}`
                        : `Online + Onsite • ${prog.city || "Jakarta"}`;

                    return (
                      <div
                        key={prog.id}
                        className="p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-zinc-50/70 dark:hover:bg-white/[0.02] transition"
                      >
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                          {prog.coverImage && (
                            <div className="hidden sm:block w-24 h-20 rounded-xl overflow-hidden shrink-0 border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={prog.coverImage}
                                alt={prog.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          <div className="space-y-3 min-w-0 flex-1">
                            {/* Badges Row */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5 font-semibold ${
                                  isDraft
                                    ? "bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/10"
                                    : "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isDraft ? "bg-zinc-400" : "bg-emerald-400"
                                  }`}
                                />
                                <span>{isDraft ? "Draft (Unpublished)" : "Published"}</span>
                              </span>

                              {prog.category && (
                                <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-white/10">
                                  {prog.category}
                                </span>
                              )}

                              {prog.difficultyLevel && (
                                <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-white/10">
                                  {DIFFICULTY_LEVELS.find((d) => d.value === prog.difficultyLevel)?.label || prog.difficultyLevel}
                                </span>
                              )}

                              {prog.dailyCommitment && (
                                <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-white/10 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-zinc-400" />
                                  <span>{prog.dailyCommitment}</span>
                                </span>
                              )}

                              <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-white/10 flex items-center gap-1">
                                {attendanceLabel}
                              </span>
                            </div>

                            {/* Title & Description */}
                            <div>
                              <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white">
                                {prog.title}
                              </h3>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2 mt-1 max-w-2xl">
                                {prog.description}
                              </p>
                            </div>

                            {/* Meta Row */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-500 dark:text-zinc-400 pt-1">
                              <span>
                                <strong className="text-zinc-700 dark:text-zinc-300">{targetDays}</strong> Training Days
                              </span>
                              <span>&bull;</span>
                              <span>
                                Lead: <strong className="text-zinc-700 dark:text-zinc-300">{prog.coachName}</strong>
                              </span>
                              {prog.equipment && (
                                <>
                                  <span>&bull;</span>
                                  <span className="flex items-center gap-1">
                                    <Dumbbell className="w-3 h-3 text-zinc-400" />
                                    <span>{prog.equipment}</span>
                                  </span>
                                </>
                              )}
                              <span>&bull;</span>
                              <div className="flex items-center gap-1.5 font-mono">
                                <span className="font-semibold text-zinc-900 dark:text-white">
                                  Rp {prog.price.toLocaleString("id-ID")}
                                </span>
                              {prog.discountPercentage && prog.discountPercentage > 0 ? (
                                <>
                                  <span className="line-through text-zinc-400 text-[10px]">
                                    Rp {(prog.actualPrice || prog.price).toLocaleString("id-ID")}
                                  </span>
                                  <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-zinc-200 dark:bg-white/20 text-zinc-900 dark:text-white">
                                    -{prog.discountPercentage}%
                                  </span>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>

                        {/* Right side: Completeness & Manage button */}
                        <div className="flex flex-col sm:flex-row lg:items-center gap-6 shrink-0 lg:pl-6 lg:border-l border-zinc-100 dark:border-white/10">
                          <div className="w-full sm:w-36 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-zinc-500 dark:text-zinc-400">Curriculum</span>
                              <span className="font-mono font-medium text-zinc-900 dark:text-white">
                                {filledCount}/{targetDays}d
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-white/10 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-zinc-900 dark:bg-white transition-all duration-300"
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => openProgramDetail(prog)}
                            className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium flex items-center justify-center gap-2 hover:opacity-90 transition shadow-xs"
                          >
                            <span>Manage Program</span>
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
        {/* VIEW 1B: CREATE NEW PROGRAM                                       */}
        {/* ================================================================= */}
        {activeMenu === "programs" && isCreatingProgram && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header with Back Button */}
            <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-6 sm:p-7 border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-3">
              <button
                type="button"
                onClick={() => setIsCreatingProgram(false)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition w-fit whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5 shrink-0" /> Back to Programs
              </button>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 font-medium">
                  Draft Program
                </span>
                <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                  {createForm.durationDays} Days • Net Rp{" "}
                  {Math.max(
                    0,
                    Math.round(
                      (Number(createForm.actualPrice) || 0) *
                        (1 - (Number(createForm.discountPercentage) || 0) / 100)
                    )
                  ).toLocaleString("id-ID")}
                </span>
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
                Create Program Header
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-2xl">
                Configure program metadata, schedule duration, master coach, audience, and pricing. Saved as Draft until you choose to publish.
              </p>
            </div>

            {/* Program Header Form */}
            <form onSubmit={handleCreateProgramSubmit} className="bg-white dark:bg-zinc-900/90 rounded-2xl p-7 sm:p-10 space-y-10 border border-zinc-200/80 dark:border-white/10 shadow-xs">
              
              {/* 1. PROGRAM INFORMATION */}
              <div className="space-y-5">
                <div className="border-b border-zinc-100 dark:border-white/10 pb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                    1. Program Information
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                    Core identity, intensity level, banner imagery, and public synopsis
                  </p>
                </div>

                <div className="grid sm:grid-cols-3 gap-5">
                  <div className="sm:col-span-2 space-y-2">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Program Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.title}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, title: e.target.value }))
                      }
                      placeholder="e.g. 7-Day Foundation Pilates & Core Flow"
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Difficulty / Intensity *
                    </label>
                    <select
                      value={createForm.difficultyLevel}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, difficultyLevel: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    >
                      {DIFFICULTY_LEVELS.map((lvl) => (
                        <option key={lvl.value} value={lvl.value} className="bg-white dark:bg-zinc-900">
                          {lvl.label} – {lvl.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cover / Banner Image with Preview */}
                  <div className="sm:col-span-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Cover / Banner Image URL</span>
                      </label>
                      {createForm.coverImage && (
                        <button
                          type="button"
                          onClick={() => setCreateForm((p) => ({ ...p, coverImage: "" }))}
                          className="text-[10px] text-zinc-500 hover:text-red-500 transition underline"
                        >
                          Clear Image
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      value={createForm.coverImage}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, coverImage: e.target.value }))
                      }
                      placeholder="https://images.unsplash.com/... or CDN banner URL"
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                    />
                    <div className="relative h-28 sm:h-36 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50 dark:bg-white/5 overflow-hidden flex items-center justify-center">
                      {createForm.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={createForm.coverImage}
                          alt="Banner Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-zinc-400 text-center px-4">
                          <ImageIcon className="w-6 h-6 stroke-1 text-zinc-400" />
                          <span className="text-[11px]">Recommended 16:9 banner preview will appear here</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-3 space-y-2">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Short Description *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={createForm.description}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, description: e.target.value }))
                      }
                      placeholder="Concise overview of curriculum rhythm, daily focus, and target transformation..."
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                    />
                  </div>
                </div>
              </div>

              {/* 2. DIRECTORIES & CLASSIFICATION */}
              <div className="space-y-5 pt-6 border-t border-zinc-100 dark:border-white/10">
                <div className="border-b border-zinc-100 dark:border-white/10 pb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                    2. Directories &amp; Classification
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                    Taxonomy, coaching team, target personas, equipment, and daily time requirement (managed in Master Directories)
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <SingleSelectDirectoryPicker
                    label="Category / Discipline *"
                    subLabel="Program taxonomy"
                    value={createForm.category}
                    onChange={(val) => setCreateForm((p) => ({ ...p, category: val }))}
                    options={masterData.categories}
                    onManage={() => navigateToDirectory("categories")}
                    manageLabel="+ Manage in Categories Directory"
                    placeholder="Select Category..."
                    icon={Tag}
                  />

                  <SingleSelectDirectoryPicker
                    label="Daily Time Commitment *"
                    subLabel="Estimated daily session length"
                    value={createForm.dailyCommitment}
                    onChange={(val) => setCreateForm((p) => ({ ...p, dailyCommitment: val }))}
                    options={masterData.dailyCommitments || []}
                    onManage={() => navigateToDirectory("commitments")}
                    manageLabel="+ Manage in Commitments Directory"
                    placeholder="Select Daily Commitment..."
                    icon={Clock}
                  />
                </div>

                <div className="space-y-6 pt-2">
                  <DropdownTagPicker
                    label="Equipment Needed"
                    subLabel="Required tools & gear (select from master list)"
                    value={createForm.equipment}
                    onChange={(val) => setCreateForm((p) => ({ ...p, equipment: val }))}
                    options={masterData.equipment || []}
                    selectPlaceholder="Pick equipment from directory..."
                    onManage={() => navigateToDirectory("equipment")}
                    manageLabel="+ Manage in Equipment Directory"
                    icon={Dumbbell}
                  />

                  <DropdownTagPicker
                    label="Coach / Coaches *"
                    subLabel="Assign instructors leading this program"
                    value={createForm.coachName}
                    onChange={(val) => setCreateForm((p) => ({ ...p, coachName: val }))}
                    options={masterData.coaches.map((c) => ({
                      id: c.id,
                      name: c.name,
                      title: c.title,
                    }))}
                    selectPlaceholder="Pick coach from directory..."
                    onManage={() => navigateToDirectory("coaches")}
                    manageLabel="+ Manage in Coaches Directory"
                    icon={UserCheck}
                  />

                  <DropdownTagPicker
                    label="Target Audience (Recommended For) *"
                    subLabel="Ideal demographics & participant personas"
                    value={createForm.recommendedFor}
                    onChange={(val) => setCreateForm((p) => ({ ...p, recommendedFor: val }))}
                    options={masterData.targetAudiences.map((a) => ({
                      id: a.id,
                      name: a.name,
                    }))}
                    selectPlaceholder="Pick audience from directory..."
                    onManage={() => navigateToDirectory("audience")}
                    manageLabel="+ Manage in Audience Directory"
                    icon={Sparkles}
                  />
                </div>
              </div>

              {/* 3. SCHEDULE & REGISTRATION DATES */}
              <div className="space-y-5 pt-6 border-t border-zinc-100 dark:border-white/10">
                <div className="border-b border-zinc-100 dark:border-white/10 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                      3. Schedule &amp; Registration Dates
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                      Start, end, and cutoff timelines
                    </p>
                  </div>
                  <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white font-medium">
                    Duration: {createForm.durationDays} Days (Day 1 – Day {createForm.durationDays})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={createForm.startDate}
                      onChange={(e) => {
                        const newStart = e.target.value;
                        const s = new Date(newStart);
                        const en = new Date(createForm.endDate);
                        const days =
                          !isNaN(s.getTime()) && !isNaN(en.getTime()) && en >= s
                            ? Math.max(1, Math.round((en.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1)
                            : createForm.durationDays;
                        setCreateForm((p) => ({
                          ...p,
                          startDate: newStart,
                          durationDays: days,
                        }));
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={createForm.endDate}
                      onChange={(e) => {
                        const newEnd = e.target.value;
                        const s = new Date(createForm.startDate);
                        const en = new Date(newEnd);
                        const days =
                          !isNaN(s.getTime()) && !isNaN(en.getTime()) && en >= s
                            ? Math.max(1, Math.round((en.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1)
                            : 1;
                        setCreateForm((p) => ({
                          ...p,
                          endDate: newEnd,
                          durationDays: days,
                        }));
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Registration Open Date
                      </label>
                      <label className="flex items-center gap-1.5 text-[11px] text-zinc-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={createForm.isTbaOpenDate}
                          onChange={(e) =>
                            setCreateForm((p) => ({
                              ...p,
                              isTbaOpenDate: e.target.checked,
                              registrationOpenDate: e.target.checked ? "" : p.registrationOpenDate,
                            }))
                          }
                          className="rounded text-zinc-900 focus:ring-zinc-400 border-zinc-300 dark:border-zinc-700 bg-transparent"
                        />
                        <span>TBA</span>
                      </label>
                    </div>
                    <input
                      type="date"
                      disabled={createForm.isTbaOpenDate}
                      value={createForm.registrationOpenDate}
                      onChange={(e) =>
                        setCreateForm((p) => ({
                          ...p,
                          registrationOpenDate: e.target.value,
                          isTbaOpenDate: false,
                        }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs font-mono text-zinc-900 dark:text-white disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Registration Cutoff Date *
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
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    />
                  </div>
                </div>
              </div>

              {/* 4. ATTENDANCE MODE (Online, On-Site, Online + Onsite) */}
              <div className="space-y-5 pt-6 border-t border-zinc-100 dark:border-white/10">
                <div className="border-b border-zinc-100 dark:border-white/10 pb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                    4. Attendance Mode
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                    Select delivery format and studio venue location if on-site
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      { key: "ONLINE", label: "Online" },
                      { key: "ONSITE", label: "On-Site" },
                      { key: "HYBRID", label: "Online + Onsite" },
                    ].map((mode) => (
                      <button
                        key={mode.key}
                        type="button"
                        onClick={() =>
                          setCreateForm((p) => ({
                            ...p,
                            locationType: mode.key as "ONLINE" | "ONSITE" | "HYBRID",
                          }))
                        }
                        className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition ${
                          createForm.locationType === mode.key
                            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs border-transparent"
                            : "bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>

                  {createForm.locationType !== "ONLINE" && (
                    <div className="grid sm:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          City / Metropolitan Area *
                        </label>
                        <input
                          type="text"
                          required
                          value={createForm.city}
                          onChange={(e) =>
                            setCreateForm((p) => ({ ...p, city: e.target.value }))
                          }
                          placeholder="e.g. Jakarta Selatan"
                          className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          Studio Physical Venue Address
                        </label>
                        <input
                          type="text"
                          value={createForm.venueAddress}
                          onChange={(e) =>
                            setCreateForm((p) => ({ ...p, venueAddress: e.target.value }))
                          }
                          placeholder="e.g. The BMS Studio, Jl. Senopati No. 18"
                          className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. PRICING & QUOTA */}
              <div className="space-y-5 pt-6 border-t border-zinc-100 dark:border-white/10">
                <div className="border-b border-zinc-100 dark:border-white/10 pb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                    5. Pricing &amp; Participant Quota
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                    Tuition structure, promotional discount, and participant seat cap
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Capacity (Seats) *
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
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Actual Tuition (IDR) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      required
                      value={createForm.actualPrice}
                      onChange={(e) => {
                        const actual = Number(e.target.value) || 0;
                        const disc = Number(createForm.discountPercentage) || 0;
                        setCreateForm((p) => ({
                          ...p,
                          actualPrice: actual,
                          price: Math.max(0, Math.round(actual * (1 - disc / 100))),
                        }));
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Discount (5% Multiples)
                    </label>
                    <select
                      value={createForm.discountPercentage}
                      onChange={(e) => {
                        const disc = Number(e.target.value) || 0;
                        const actual = Number(createForm.actualPrice) || 0;
                        setCreateForm((p) => ({
                          ...p,
                          discountPercentage: disc,
                          price: Math.max(0, Math.round(actual * (1 - disc / 100))),
                        }));
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    >
                      {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((d) => (
                        <option key={d} value={d} className="dark:bg-zinc-900">
                          {d === 0 ? "0% (No Discount)" : `${d}% Off`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Final Calculated Tuition
                    </label>
                    <div className="w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-white/10 border border-zinc-200 dark:border-white/10 text-xs font-mono font-bold text-zinc-900 dark:text-white flex items-center justify-between">
                      <span>Rp {createForm.price.toLocaleString("id-ID")}</span>
                      {createForm.discountPercentage > 0 && (
                        <span className="text-[10px] text-zinc-400 font-normal">
                          -{createForm.discountPercentage}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. COMMUNITY CHANNEL LINK */}
              <div className="space-y-5 pt-6 border-t border-zinc-100 dark:border-white/10">
                <div className="border-b border-zinc-100 dark:border-white/10 pb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                    6. Community Channel / Group URL
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                    Private group or channel link for enrolled members (WhatsApp, Discord, LINE, WeChat, Slack, Telegram)
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Community Channel / Group URL
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
                    placeholder="https://chat.whatsapp.com/..., discord.gg/..., line.me/..., etc."
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                  />
                </div>
              </div>

              {/* SUBMIT / CANCEL ACTIONS */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-zinc-100 dark:border-white/10">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Initial status is <strong>Draft (Unpublished)</strong>. Once created, you can configure daily schedules and publish whenever ready.
                </span>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsCreatingProgram(false)}
                    className="px-5 py-2.5 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingLoading}
                    className="px-6 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium flex items-center gap-2 hover:opacity-90 transition shadow-xs disabled:opacity-50"
                  >
                    {creatingLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>Create Program</span>
                  </button>
                </div>
              </div>

              {/* Validation error message directly below action buttons */}
              {createError && (
                <div className="p-4 rounded-xl text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center gap-2 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{createError}</span>
                </div>
              )}
            </form>
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW: MASTER DIRECTORIES MANAGEMENT (Stacked with Pagination & CRUD)*/}
        {/* ================================================================= */}
        {activeMenu === "master" && (() => {
          const filteredCoaches = masterData.coaches.filter(
            (c) =>
              c.name.toLowerCase().includes(masterSearch.toLowerCase()) ||
              c.title.toLowerCase().includes(masterSearch.toLowerCase())
          );
          const coachPageSize = MASTER_PAGE_SIZE;
          const totalCoachPages = Math.max(1, Math.ceil(filteredCoaches.length / coachPageSize));
          const paginatedCoaches = filteredCoaches.slice(
            (coachPage - 1) * coachPageSize,
            coachPage * coachPageSize
          );

          const filteredAudiences = masterData.targetAudiences.filter((a) =>
            a.name.toLowerCase().includes(masterSearch.toLowerCase())
          );
          const audiencePageSize = MASTER_PAGE_SIZE;
          const totalAudiencePages = Math.max(1, Math.ceil(filteredAudiences.length / audiencePageSize));
          const paginatedAudiences = filteredAudiences.slice(
            (audiencePage - 1) * audiencePageSize,
            audiencePage * audiencePageSize
          );

          const filteredCategories = masterData.categories.filter((cat) =>
            cat.name.toLowerCase().includes(masterSearch.toLowerCase())
          );
          const categoryPageSize = MASTER_PAGE_SIZE;
          const totalCategoryPages = Math.max(1, Math.ceil(filteredCategories.length / categoryPageSize));
          const paginatedCategories = filteredCategories.slice(
            (categoryPage - 1) * categoryPageSize,
            categoryPage * categoryPageSize
          );

          const filteredEquipment = (masterData.equipment || []).filter((eq) =>
            eq.name.toLowerCase().includes(masterSearch.toLowerCase())
          );
          const equipmentPageSize = MASTER_PAGE_SIZE;
          const totalEquipmentPages = Math.max(1, Math.ceil(filteredEquipment.length / equipmentPageSize));
          const paginatedEquipment = filteredEquipment.slice(
            (equipmentPage - 1) * equipmentPageSize,
            equipmentPage * equipmentPageSize
          );

          const filteredCommitments = (masterData.dailyCommitments || []).filter((cm) =>
            cm.name.toLowerCase().includes(masterSearch.toLowerCase())
          );
          const commitmentPageSize = MASTER_PAGE_SIZE;
          const totalCommitmentPages = Math.max(1, Math.ceil(filteredCommitments.length / commitmentPageSize));
          const paginatedCommitments = filteredCommitments.slice(
            (commitmentPage - 1) * commitmentPageSize,
            commitmentPage * commitmentPageSize
          );

          return (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Header Card */}
              <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-6 sm:p-8 border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-5">
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 font-medium">
                    Central Catalog
                  </span>
                  <h2 className="text-xl sm:text-2xl font-geometric font-light tracking-tight text-zinc-900 dark:text-white">
                    Master Directories
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-2xl">
                    Manage instructors, target audience personas, categories, required equipment, and standardized daily commitments used across all wellness programs.
                  </p>
                </div>

                {/* Sub-tab Switcher & Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-zinc-100 dark:border-white/10">
                  <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 w-fit">
                    {(
                      [
                        { id: "all", label: "All Directories" },
                        { id: "coaches", label: `Coaches (${masterData.coaches.length})` },
                        { id: "audience", label: `Target Audience (${masterData.targetAudiences.length})` },
                        { id: "categories", label: `Categories (${masterData.categories.length})` },
                        { id: "equipment", label: `Equipment (${(masterData.equipment || []).length})` },
                        { id: "commitments", label: `Daily Commitments (${(masterData.dailyCommitments || []).length})` },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setMasterTab(tab.id);
                          setCoachPage(1);
                          setAudiencePage(1);
                          setCategoryPage(1);
                          setEquipmentPage(1);
                          setCommitmentPage(1);
                        }}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                          masterTab === tab.id
                            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs"
                            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Search Filter */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={masterSearch}
                      onChange={(e) => {
                        setMasterSearch(e.target.value);
                        setCoachPage(1);
                        setAudiencePage(1);
                        setCategoryPage(1);
                        setEquipmentPage(1);
                        setCommitmentPage(1);
                      }}
                      placeholder="Search directories..."
                      className="w-full pl-9 pr-8 py-2 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                    />
                    {masterSearch && (
                      <button
                        type="button"
                        onClick={() => setMasterSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 1. COACHES DIRECTORY SECTION (Full Width Stack) */}
              {(masterTab === "all" || masterTab === "coaches") && (
                <div className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200/80 dark:border-white/10 shadow-xs p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-white/10 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                          <span>Coaches Directory</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 font-mono">
                            {filteredCoaches.length} {filteredCoaches.length === 1 ? "Coach" : "Coaches"}
                          </span>
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Instructors and specialists assigned to lead programs and daily workouts
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCoach(!showAddCoach);
                        setEditingCoach(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium flex items-center gap-1.5 shadow-xs hover:opacity-90 transition shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{showAddCoach ? "Close Form" : "Add Coach"}</span>
                    </button>
                  </div>

                  {/* Add Coach Collapsible Form */}
                  {showAddCoach && (
                    <form
                      onSubmit={async (e) => {
                        await handleAddCoach(e);
                        setShowAddCoach(false);
                      }}
                      className="p-5 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 space-y-4 animate-in fade-in duration-200"
                    >
                      <h4 className="text-xs font-semibold text-zinc-900 dark:text-white">
                        Create New Master Coach
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            Coach Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={newCoachName}
                            onChange={(e) => setNewCoachName(e.target.value)}
                            placeholder="e.g. Coach Marcus Vance"
                            className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            Title / Specialization *
                          </label>
                          <input
                            type="text"
                            required
                            value={newCoachTitle}
                            onChange={(e) => setNewCoachTitle(e.target.value)}
                            placeholder="e.g. Master Pilates & Longevity Specialist"
                            className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="submit"
                          disabled={masterActionLoading}
                          className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium hover:opacity-90 transition disabled:opacity-50"
                        >
                          Save Coach
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddCoach(false)}
                          className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-white/10 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:opacity-80 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Edit Coach Form */}
                  {editingCoach && (
                    <form
                      onSubmit={handleUpdateCoach}
                      className="p-5 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 space-y-4 animate-in fade-in duration-200"
                    >
                      <h4 className="text-xs font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Pencil className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Edit Coach Profile</span>
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            Coach Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={editingCoach.name}
                            onChange={(e) =>
                              setEditingCoach((p) => (p ? { ...p, name: e.target.value } : null))
                            }
                            className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            Title / Specialization *
                          </label>
                          <input
                            type="text"
                            required
                            value={editingCoach.title}
                            onChange={(e) =>
                              setEditingCoach((p) => (p ? { ...p, title: e.target.value } : null))
                            }
                            className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="submit"
                          disabled={masterActionLoading}
                          className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium hover:opacity-90 transition disabled:opacity-50"
                        >
                          Update Coach
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCoach(null)}
                          className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-white/10 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:opacity-80 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Coaches List / Table */}
                  <div className="border border-zinc-200/80 dark:border-white/10 rounded-2xl overflow-hidden">
                    <div className="divide-y divide-zinc-100 dark:divide-white/5">
                      {paginatedCoaches.length === 0 ? (
                        <div className="p-8 text-center text-xs text-zinc-500">
                          {masterSearch
                            ? `No coaches match "${masterSearch}".`
                            : "No coaches added yet. Click \"Add Coach\" above to add one."}
                        </div>
                      ) : (
                        paginatedCoaches.map((c) => (
                          <div
                            key={c.id}
                            className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-white/10 flex items-center justify-center text-xs font-semibold text-zinc-800 dark:text-zinc-200 shrink-0">
                                {c.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white truncate">
                                  {c.name}
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                  {c.title}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCoach({ id: c.id, name: c.name, title: c.title });
                                  setShowAddCoach(false);
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition flex items-center gap-1 border border-zinc-200/60 dark:border-white/10"
                                title="Edit coach"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCoach(c.id, c.name)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                                title="Delete coach"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Coaches Pagination */}
                  <PaginationBar
                    currentPage={coachPage}
                    totalPages={totalCoachPages}
                    onPageChange={setCoachPage}
                    totalItems={filteredCoaches.length}
                    pageSize={coachPageSize}
                    itemLabel="coaches"
                  />
                </div>
              )}

              {/* 2. TARGET AUDIENCE DIRECTORY SECTION (Full Width Stack) */}
              {(masterTab === "all" || masterTab === "audience") && (
                <div className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200/80 dark:border-white/10 shadow-xs p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-white/10 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                          <span>Target Audience Directory</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 font-mono">
                            {filteredAudiences.length} {filteredAudiences.length === 1 ? "Persona" : "Personas"}
                          </span>
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Recommended demographics, life stages, and lifestyle personas
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowAddAudience(!showAddAudience);
                        setEditingAudience(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium flex items-center gap-1.5 shadow-xs hover:opacity-90 transition shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{showAddAudience ? "Close Form" : "Add Target Audience"}</span>
                    </button>
                  </div>

                  {/* Add Audience Form */}
                  {showAddAudience && (
                    <form
                      onSubmit={async (e) => {
                        await handleAddAudience(e);
                        setShowAddAudience(false);
                      }}
                      className="p-5 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 space-y-4 animate-in fade-in duration-200"
                    >
                      <h4 className="text-xs font-semibold text-zinc-900 dark:text-white">
                        Create New Target Audience Persona
                      </h4>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          Persona Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={newAudienceName}
                          onChange={(e) => setNewAudienceName(e.target.value)}
                          placeholder="e.g. Business Woman, Postpartum Mom, Desk Worker"
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="submit"
                          disabled={masterActionLoading}
                          className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium hover:opacity-90 transition disabled:opacity-50"
                        >
                          Save Persona
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddAudience(false)}
                          className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-white/10 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:opacity-80 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Edit Audience Form */}
                  {editingAudience && (
                    <form
                      onSubmit={handleUpdateAudience}
                      className="p-5 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 space-y-4 animate-in fade-in duration-200"
                    >
                      <h4 className="text-xs font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Pencil className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Edit Target Audience Persona</span>
                      </h4>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          Persona Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingAudience.name}
                          onChange={(e) =>
                            setEditingAudience((p) => (p ? { ...p, name: e.target.value } : null))
                          }
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="submit"
                          disabled={masterActionLoading}
                          className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium hover:opacity-90 transition disabled:opacity-50"
                        >
                          Update Persona
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingAudience(null)}
                          className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-white/10 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:opacity-80 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Audience List / Table */}
                  <div className="border border-zinc-200/80 dark:border-white/10 rounded-2xl overflow-hidden">
                    <div className="divide-y divide-zinc-100 dark:divide-white/5">
                      {paginatedAudiences.length === 0 ? (
                        <div className="p-8 text-center text-xs text-zinc-500">
                          {masterSearch
                            ? `No target audience personas match "${masterSearch}".`
                            : "No personas added yet. Click \"Add Target Audience\" above to create one."}
                        </div>
                      ) : (
                        paginatedAudiences.map((aud) => (
                          <div
                            key={aud.id}
                            className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-white/10">
                                {aud.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingAudience({ id: aud.id, name: aud.name });
                                  setShowAddAudience(false);
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition flex items-center gap-1 border border-zinc-200/60 dark:border-white/10"
                                title="Edit persona"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAudience(aud.id, aud.name)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                                title="Delete persona"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Audience Pagination */}
                  <PaginationBar
                    currentPage={audiencePage}
                    totalPages={totalAudiencePages}
                    onPageChange={setAudiencePage}
                    totalItems={filteredAudiences.length}
                    pageSize={audiencePageSize}
                    itemLabel="personas"
                  />
                </div>
              )}

              {/* 3. CATEGORIES DIRECTORY SECTION (Full Width Stack) */}
              {(masterTab === "all" || masterTab === "categories") && (
                <div className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200/80 dark:border-white/10 shadow-xs p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-white/10 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                        <Tag className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                          <span>Categories Directory</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 font-mono">
                            {filteredCategories.length} {filteredCategories.length === 1 ? "Category" : "Categories"}
                          </span>
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Primary movement disciplines and taxonomy classifications
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCategory(!showAddCategory);
                        setEditingCategory(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium flex items-center gap-1.5 shadow-xs hover:opacity-90 transition shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{showAddCategory ? "Close Form" : "Add Category"}</span>
                    </button>
                  </div>

                  {/* Add Category Form */}
                  {showAddCategory && (
                    <form
                      onSubmit={async (e) => {
                        await handleAddCategory(e);
                        setShowAddCategory(false);
                      }}
                      className="p-5 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 space-y-4 animate-in fade-in duration-200"
                    >
                      <h4 className="text-xs font-semibold text-zinc-900 dark:text-white">
                        Create New Program Category
                      </h4>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          Category Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="e.g. Pilates, HIIT & Strength, Mobility & Longevity"
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="submit"
                          disabled={masterActionLoading}
                          className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium hover:opacity-90 transition disabled:opacity-50"
                        >
                          Save Category
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddCategory(false)}
                          className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-white/10 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:opacity-80 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Edit Category Form */}
                  {editingCategory && (
                    <form
                      onSubmit={handleUpdateCategory}
                      className="p-5 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 space-y-4 animate-in fade-in duration-200"
                    >
                      <h4 className="text-xs font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Pencil className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Edit Category Name</span>
                      </h4>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          Category Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingCategory.name}
                          onChange={(e) =>
                            setEditingCategory((p) => (p ? { ...p, name: e.target.value } : null))
                          }
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="submit"
                          disabled={masterActionLoading}
                          className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium hover:opacity-90 transition disabled:opacity-50"
                        >
                          Update Category
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCategory(null)}
                          className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-white/10 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:opacity-80 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Categories List / Table */}
                  <div className="border border-zinc-200/80 dark:border-white/10 rounded-2xl overflow-hidden">
                    <div className="divide-y divide-zinc-100 dark:divide-white/5">
                      {paginatedCategories.length === 0 ? (
                        <div className="p-8 text-center text-xs text-zinc-500">
                          {masterSearch
                            ? `No categories match "${masterSearch}".`
                            : "No categories added yet. Click \"Add Category\" above to create one."}
                        </div>
                      ) : (
                        paginatedCategories.map((cat) => (
                          <div
                            key={cat.id}
                            className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-white/10">
                                {cat.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCategory({ id: cat.id, name: cat.name });
                                  setShowAddCategory(false);
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition flex items-center gap-1 border border-zinc-200/60 dark:border-white/10"
                                title="Edit category"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                                title="Delete category"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Categories Pagination */}
                  <PaginationBar
                    currentPage={categoryPage}
                    totalPages={totalCategoryPages}
                    onPageChange={setCategoryPage}
                    totalItems={filteredCategories.length}
                    pageSize={categoryPageSize}
                    itemLabel="categories"
                  />
                </div>
              )}

              {/* 4. EQUIPMENT DIRECTORY SECTION (Full Width Stack) */}
              {(masterTab === "all" || masterTab === "equipment") && (
                <div className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200/80 dark:border-white/10 shadow-xs p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-white/10 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                        <Dumbbell className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                          Equipment Directory
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Physical training tools and equipment options ({(masterData.equipment || []).length} items registered)
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowAddEquipment(!showAddEquipment);
                        setEditingEquipment(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium flex items-center gap-1.5 shadow-xs hover:opacity-90 transition shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{showAddEquipment ? "Close Form" : "Add Equipment"}</span>
                    </button>
                  </div>

                  {/* Add Equipment Collapsible Form */}
                  {showAddEquipment && (
                    <form
                      onSubmit={async (e) => {
                        await handleAddEquipment(e);
                        setShowAddEquipment(false);
                      }}
                      className="p-5 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 space-y-4 animate-in fade-in duration-200"
                    >
                      <h4 className="text-xs font-semibold text-zinc-900 dark:text-white">
                        Create New Master Equipment
                      </h4>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          Equipment Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={newEquipmentName}
                          onChange={(e) => setNewEquipmentName(e.target.value)}
                          placeholder="e.g. Yoga Mat, Foam Roller, Resistance Bands, Dumbbells"
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="submit"
                          disabled={masterActionLoading}
                          className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium hover:opacity-90 transition disabled:opacity-50"
                        >
                          Save Equipment
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddEquipment(false)}
                          className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-white/10 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:opacity-80 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Edit Equipment Form */}
                  {editingEquipment && (
                    <form
                      onSubmit={handleUpdateEquipment}
                      className="p-5 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 space-y-4 animate-in fade-in duration-200"
                    >
                      <h4 className="text-xs font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Pencil className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Edit Equipment Name</span>
                      </h4>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          Equipment Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingEquipment.name}
                          onChange={(e) =>
                            setEditingEquipment((p) => (p ? { ...p, name: e.target.value } : null))
                          }
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="submit"
                          disabled={masterActionLoading}
                          className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium hover:opacity-90 transition disabled:opacity-50"
                        >
                          Update Equipment
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingEquipment(null)}
                          className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-white/10 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:opacity-80 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Equipment Items List */}
                  <div className="rounded-xl border border-zinc-200/80 dark:border-white/10 overflow-hidden">
                    <div className="divide-y divide-zinc-200/60 dark:divide-white/10">
                      {paginatedEquipment.length === 0 ? (
                        <div className="p-8 text-center text-xs text-zinc-500">
                          {masterSearch
                            ? `No equipment matches "${masterSearch}".`
                            : "No equipment added yet. Click \"Add Equipment\" above to create one."}
                        </div>
                      ) : (
                        paginatedEquipment.map((eq) => (
                          <div
                            key={eq.id}
                            className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-white/10">
                                {eq.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingEquipment({ id: eq.id, name: eq.name });
                                  setShowAddEquipment(false);
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition flex items-center gap-1 border border-zinc-200/60 dark:border-white/10"
                                title="Edit equipment"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEquipment(eq.id, eq.name)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                                title="Delete equipment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Equipment Pagination */}
                  <PaginationBar
                    currentPage={equipmentPage}
                    totalPages={totalEquipmentPages}
                    onPageChange={setEquipmentPage}
                    totalItems={filteredEquipment.length}
                    pageSize={equipmentPageSize}
                    itemLabel="equipment"
                  />
                </div>
              )}

              {/* 5. DAILY TIME COMMITMENT DIRECTORY SECTION (Full Width Stack) */}
              {(masterTab === "all" || masterTab === "commitments") && (
                <div className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200/80 dark:border-white/10 shadow-xs p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-white/10 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                          Daily Time Commitment Directory
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Standardized daily time requirements ({(masterData.dailyCommitments || []).length} options registered)
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCommitment(!showAddCommitment);
                        setEditingCommitment(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium flex items-center gap-1.5 shadow-xs hover:opacity-90 transition shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{showAddCommitment ? "Close Form" : "Add Commitment"}</span>
                    </button>
                  </div>

                  {/* Add Commitment Collapsible Form */}
                  {showAddCommitment && (
                    <form
                      onSubmit={async (e) => {
                        await handleAddCommitment(e);
                        setShowAddCommitment(false);
                      }}
                      className="p-5 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 space-y-4 animate-in fade-in duration-200"
                    >
                      <h4 className="text-xs font-semibold text-zinc-900 dark:text-white">
                        Create New Daily Time Commitment
                      </h4>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          Time Commitment Label *
                        </label>
                        <input
                          type="text"
                          required
                          value={newCommitmentName}
                          onChange={(e) => setNewCommitmentName(e.target.value)}
                          placeholder="e.g. 15 - 20 Mins / Day, 20 - 30 Mins / Day, 45 Mins / Day"
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="submit"
                          disabled={masterActionLoading}
                          className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium hover:opacity-90 transition disabled:opacity-50"
                        >
                          Save Commitment
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddCommitment(false)}
                          className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-white/10 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:opacity-80 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Edit Commitment Form */}
                  {editingCommitment && (
                    <form
                      onSubmit={handleUpdateCommitment}
                      className="p-5 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 space-y-4 animate-in fade-in duration-200"
                    >
                      <h4 className="text-xs font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Pencil className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Edit Daily Time Commitment</span>
                      </h4>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          Time Commitment Label *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingCommitment.name}
                          onChange={(e) =>
                            setEditingCommitment((p) => (p ? { ...p, name: e.target.value } : null))
                          }
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="submit"
                          disabled={masterActionLoading}
                          className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium hover:opacity-90 transition disabled:opacity-50"
                        >
                          Update Commitment
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCommitment(null)}
                          className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-white/10 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:opacity-80 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Commitments Items List */}
                  <div className="rounded-xl border border-zinc-200/80 dark:border-white/10 overflow-hidden">
                    <div className="divide-y divide-zinc-200/60 dark:divide-white/10">
                      {paginatedCommitments.length === 0 ? (
                        <div className="p-8 text-center text-xs text-zinc-500">
                          {masterSearch
                            ? `No daily commitments match "${masterSearch}".`
                            : "No commitments added yet. Click \"Add Commitment\" above to create one."}
                        </div>
                      ) : (
                        paginatedCommitments.map((cm) => (
                          <div
                            key={cm.id}
                            className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-white/10">
                                {cm.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCommitment({ id: cm.id, name: cm.name });
                                  setShowAddCommitment(false);
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition flex items-center gap-1 border border-zinc-200/60 dark:border-white/10"
                                title="Edit commitment"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCommitment(cm.id, cm.name)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                                title="Delete commitment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Commitments Pagination */}
                  <PaginationBar
                    currentPage={commitmentPage}
                    totalPages={totalCommitmentPages}
                    onPageChange={setCommitmentPage}
                    totalItems={filteredCommitments.length}
                    pageSize={commitmentPageSize}
                    itemLabel="commitments"
                  />
                </div>
              )}
            </div>
          );
        })()}

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
              <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-7 sm:p-9 border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedProgramId(null)}
                    className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition w-fit"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 shrink-0" /> Back to Programs
                  </button>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Publication & Status Action Button */}
                    {!selectedProgram.isPublished ? (
                      <button
                        type="button"
                        onClick={() => handleInitiatePublish(selectedProgram)}
                        disabled={publishingId === selectedProgram.id}
                        className="px-4 py-2 rounded-xl text-xs font-medium bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 transition shadow-xs flex items-center gap-2 disabled:opacity-50"
                      >
                        {publishingId === selectedProgram.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                        <span>Publish Program</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(selectedProgram, false)}
                        disabled={publishingId === selectedProgram.id}
                        className="px-4 py-2 rounded-xl text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-800 dark:text-zinc-200 transition border border-zinc-200 dark:border-white/10 flex items-center gap-2 disabled:opacity-50"
                      >
                        {publishingId === selectedProgram.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                        <span>Unpublish (Revert to Draft)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteProgram(selectedProgram)}
                      disabled={deletingProgId === selectedProgram.id}
                      className="p-2 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition border border-transparent hover:border-red-200 dark:hover:border-red-900/50"
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

                {(() => {
                  const nowTime = new Date().getTime();
                  const openTime = selectedProgram.registrationOpenDate
                    ? new Date(selectedProgram.registrationOpenDate).getTime()
                    : null;
                  const deadlineTime = new Date(selectedProgram.registrationDeadline).getTime();

                  const isDraft = !selectedProgram.isPublished;
                  const isComingSoon = !isDraft && (openTime === null || nowTime < openTime);
                  const isClosed = !isDraft && nowTime > deadlineTime;
                  const isJoinNow = !isDraft && !isComingSoon && !isClosed;

                  const attendanceLabel =
                    selectedProgram.locationType === "ONLINE"
                      ? "Online"
                      : selectedProgram.locationType === "ONSITE"
                      ? `On-Site • ${selectedProgram.city || "Jakarta"}`
                      : `Online + Onsite • ${selectedProgram.city || "Jakarta"}`;

                  return (
                    <div className="space-y-6">
                      {/* Top Badges & Status */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span
                          className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 font-semibold ${
                            isDraft
                              ? "bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/10"
                              : isJoinNow
                              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950"
                              : isComingSoon
                              ? "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700"
                              : "bg-zinc-100 text-zinc-500 dark:bg-white/5 dark:text-zinc-400"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isDraft
                                ? "bg-zinc-400"
                                : isJoinNow
                                ? "bg-emerald-400 animate-pulse"
                                : isComingSoon
                                ? "bg-amber-400"
                                : "bg-zinc-400"
                            }`}
                          />
                          <span>
                            {isDraft
                              ? "Draft (Unpublished)"
                              : isJoinNow
                              ? "Join Now (Published)"
                              : isComingSoon
                              ? "Coming Soon (Published)"
                              : "Registration Closed"}
                          </span>
                        </span>

                        <span className="text-[10px] font-medium px-3 py-1 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-white/10">
                          {selectedProgram.category || "Pilates"}
                        </span>

                        <span className="text-[10px] font-medium px-3 py-1 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-white/10">
                          {attendanceLabel}
                        </span>
                      </div>

                      {/* Main Title & Description with Negative Space */}
                      <div className="space-y-2 max-w-3xl">
                        <h2 className="text-2xl sm:text-3xl font-geometric font-light tracking-tight text-zinc-900 dark:text-white leading-tight">
                          {selectedProgram.title}
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed pt-1">
                          {selectedProgram.description}
                        </p>
                      </div>

                      {/* Key Metric Panels (2 per row for generous negative space) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 space-y-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                            Duration
                          </span>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                            {selectedProgram.durationDays} Training Days
                          </p>
                          <span className="text-[11px] text-zinc-500 block">
                            Starts {formatDate(selectedProgram.startDate)}
                          </span>
                        </div>

                        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 space-y-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                            Tuition Fee
                          </span>
                          <p className="text-sm font-semibold font-mono text-zinc-900 dark:text-white">
                            Rp {selectedProgram.price.toLocaleString("id-ID")}
                          </p>
                          {selectedProgram.discountPercentage && selectedProgram.discountPercentage > 0 ? (
                            <span className="text-[11px] text-zinc-500 block">
                              <span className="line-through">Rp {(selectedProgram.actualPrice || selectedProgram.price).toLocaleString("id-ID")}</span> (-{selectedProgram.discountPercentage}%)
                            </span>
                          ) : (
                            <span className="text-[11px] text-zinc-500 block">Standard tuition</span>
                          )}
                        </div>

                        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 space-y-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                            Coach / Coaches
                          </span>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                            {selectedProgram.coachName}
                          </p>
                          <span className="text-[11px] text-zinc-500 truncate block">
                            {selectedProgram.coachTitle || "Specialist Instructor"}
                          </span>
                        </div>

                        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 space-y-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                            Capacity &amp; Target
                          </span>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                            {selectedProgram.maxQuota} Seats
                          </p>
                          <span className="text-[11px] text-zinc-500 truncate block">
                            {selectedProgram.recommendedFor || "All Levels"}
                          </span>
                        </div>
                      </div>

                      {/* Registration Timeline & Community Link */}
                      <div className="p-4 rounded-xl bg-zinc-50/70 dark:bg-white/[0.03] border border-zinc-200/60 dark:border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                        <div>
                          <span className="text-zinc-400 uppercase text-[10px] tracking-wider mr-2">Registration:</span>
                          <strong className="text-zinc-900 dark:text-white">
                            {selectedProgram.registrationOpenDate ? formatDate(selectedProgram.registrationOpenDate) : "TBA"}
                          </strong>{" "}
                          &rarr;{" "}
                          <strong className="text-zinc-900 dark:text-white">
                            {formatDate(selectedProgram.registrationDeadline)}
                          </strong>
                        </div>
                        {selectedProgram.communityLink && (
                          <a
                            href={selectedProgram.communityLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-900 dark:text-white hover:underline flex items-center gap-1.5 font-sans text-xs"
                          >
                            <span>Community Group</span> &rarr;
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* TWO-TAB NAVIGATOR: PROGRAM INFORMATION & DAILY SCHEDULE */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 w-fit">
                <button
                  type="button"
                  onClick={() => setProgramDetailTab("info")}
                  className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition ${
                    programDetailTab === "info"
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  {selectedProgram.isPublished ? (
                    <Lock className="w-3.5 h-3.5 text-zinc-400" />
                  ) : (
                    <FileEdit className="w-3.5 h-3.5" />
                  )}
                  <span>Program Information</span>
                  {selectedProgram.isPublished && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider">
                      Locked
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setProgramDetailTab("schedule")}
                  className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition ${
                    programDetailTab === "schedule"
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Daily Schedule</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-white/10 font-medium">
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
                    <div className="bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl p-5 border border-zinc-200/80 dark:border-white/10 flex items-start gap-3.5">
                      <Lock className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                          <span>Program Terms Locked</span>
                          <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 font-bold">
                            Live &amp; Active
                          </span>
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          This program is currently published and open for member enrollments. Core parameters (pricing, duration, quota, and dates) are locked to protect paying customers and maintain program integrity. You must unpublish the program first if you need to modify core terms.
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
                    className="bg-white dark:bg-zinc-900/90 rounded-2xl p-7 sm:p-10 space-y-10 border border-zinc-200/80 dark:border-white/10 shadow-xs"
                  >
                    {/* SECTION 1: PROGRAM INFORMATION */}
                    <div className="space-y-5">
                      <div className="border-b border-zinc-100 dark:border-white/10 pb-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                          1. Program Information
                        </h3>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                          Core identity, intensity level, banner imagery, and public synopsis
                        </p>
                      </div>

                      <div className="space-y-5">
                        <div className="grid sm:grid-cols-3 gap-5">
                          <div className="sm:col-span-2 space-y-2">
                            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
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
                              placeholder="e.g. 7-Day Hot Pilates Sculpt & Flow"
                              className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                              Difficulty / Intensity *
                            </label>
                            <select
                              disabled={selectedProgram.isPublished}
                              value={metaForm.difficultyLevel}
                              onChange={(e) =>
                                setMetaForm((p) => ({ ...p, difficultyLevel: e.target.value }))
                              }
                              className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-zinc-400"
                            >
                              {DIFFICULTY_LEVELS.map((lvl) => (
                                <option key={lvl.value} value={lvl.value} className="bg-white dark:bg-zinc-900">
                                  {lvl.label} – {lvl.description}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Cover / Banner Image with Preview */}
                          <div className="sm:col-span-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
                                <span>Cover / Banner Image URL</span>
                              </label>
                              {metaForm.coverImage && !selectedProgram.isPublished && (
                                <button
                                  type="button"
                                  onClick={() => setMetaForm((p) => ({ ...p, coverImage: "" }))}
                                  className="text-[10px] text-zinc-500 hover:text-red-500 transition underline"
                                >
                                  Clear Image
                                </button>
                              )}
                            </div>
                            <input
                              type="url"
                              disabled={selectedProgram.isPublished}
                              value={metaForm.coverImage}
                              onChange={(e) =>
                                setMetaForm((p) => ({ ...p, coverImage: e.target.value }))
                              }
                              placeholder="https://images.unsplash.com/... or CDN banner URL"
                              className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                            />
                            <div className="relative h-28 sm:h-36 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50 dark:bg-white/5 overflow-hidden flex items-center justify-center">
                              {metaForm.coverImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={metaForm.coverImage}
                                  alt="Banner Preview"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="flex flex-col items-center gap-1.5 text-zinc-400 text-center px-4">
                                  <ImageIcon className="w-6 h-6 stroke-1 text-zinc-400" />
                                  <span className="text-[11px]">Recommended 16:9 banner preview will appear here</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="sm:col-span-3 space-y-2">
                            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                              Short Description *
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
                              placeholder="Brief overview of curriculum objectives, daily cadence, and member outcomes..."
                              className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white leading-relaxed disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: DIRECTORIES & CLASSIFICATION */}
                    <div className="space-y-5 pt-6 border-t border-zinc-100 dark:border-white/10">
                      <div className="border-b border-zinc-100 dark:border-white/10 pb-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                          2. Directories &amp; Classification
                        </h3>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                          Taxonomy, coaching team, target personas, equipment, and daily time requirement (managed in Master Directories)
                        </p>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-5">
                        <SingleSelectDirectoryPicker
                          label="Category / Discipline *"
                          subLabel="Program taxonomy"
                          value={metaForm.category}
                          onChange={(val) => setMetaForm((p) => ({ ...p, category: val }))}
                          options={masterData.categories}
                          onManage={() => navigateToDirectory("categories")}
                          manageLabel="+ Manage in Categories Directory"
                          placeholder="Select Category..."
                          icon={Tag}
                          disabled={selectedProgram.isPublished}
                        />

                        <SingleSelectDirectoryPicker
                          label="Daily Time Commitment *"
                          subLabel="Estimated daily session length"
                          value={metaForm.dailyCommitment}
                          onChange={(val) => setMetaForm((p) => ({ ...p, dailyCommitment: val }))}
                          options={masterData.dailyCommitments || []}
                          onManage={() => navigateToDirectory("commitments")}
                          manageLabel="+ Manage in Commitments Directory"
                          placeholder="Select Daily Commitment..."
                          icon={Clock}
                          disabled={selectedProgram.isPublished}
                        />
                      </div>

                      <div className="space-y-6 pt-2">
                        <DropdownTagPicker
                          label="Equipment Needed"
                          subLabel="Required tools & gear (select from master list)"
                          disabled={selectedProgram.isPublished}
                          value={metaForm.equipment}
                          onChange={(val) => setMetaForm((p) => ({ ...p, equipment: val }))}
                          options={masterData.equipment || []}
                          selectPlaceholder="Pick equipment from directory..."
                          onManage={() => navigateToDirectory("equipment")}
                          manageLabel="+ Manage in Equipment Directory"
                          icon={Dumbbell}
                        />

                        <DropdownTagPicker
                          label="Coach / Coaches *"
                          subLabel="Instructors assigned to lead this program"
                          disabled={selectedProgram.isPublished}
                          value={metaForm.coachName}
                          onChange={(val) => setMetaForm((p) => ({ ...p, coachName: val }))}
                          options={masterData.coaches.map((c) => ({
                            id: c.id,
                            name: c.name,
                            title: c.title,
                          }))}
                          selectPlaceholder="Pick from Master Coaches..."
                          onManage={() => navigateToDirectory("coaches")}
                          manageLabel="+ Manage in Coaches Directory"
                          icon={UserCheck}
                        />

                        <DropdownTagPicker
                          label="Target Audience (Recommended For) *"
                          subLabel="Ideal participant demographics & personas"
                          disabled={selectedProgram.isPublished}
                          value={metaForm.recommendedFor}
                          onChange={(val) => setMetaForm((p) => ({ ...p, recommendedFor: val }))}
                          options={masterData.targetAudiences.map((a) => ({
                            id: a.id,
                            name: a.name,
                          }))}
                          selectPlaceholder="Pick from Master Audience..."
                          onManage={() => navigateToDirectory("audience")}
                          manageLabel="+ Manage in Audience Directory"
                          icon={Sparkles}
                        />
                      </div>
                    </div>

                    {/* SECTION 3: DATES & DURATION */}
                    <div className="space-y-5 pt-6 border-t border-zinc-100 dark:border-white/10">
                      <div className="border-b border-zinc-100 dark:border-white/10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                            3. Schedule &amp; Duration
                          </h3>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                            Program run window and registration cutoff timeline
                          </p>
                        </div>
                        <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white font-medium w-fit">
                          Duration: {metaForm.durationDays} Days (Day 1 – Day {metaForm.durationDays})
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            Start Date *
                          </label>
                          <input
                            type="date"
                            required
                            disabled={selectedProgram.isPublished}
                            value={metaForm.startDate}
                            onChange={(e) => {
                              const newStart = e.target.value;
                              const s = new Date(newStart);
                              const en = new Date(metaForm.endDate);
                              const days =
                                !isNaN(s.getTime()) && !isNaN(en.getTime()) && en >= s
                                  ? Math.max(1, Math.round((en.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1)
                                  : metaForm.durationDays;
                              setMetaForm((p) => ({
                                ...p,
                                startDate: newStart,
                                durationDays: days,
                              }));
                            }}
                            className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs font-mono text-zinc-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-zinc-400"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            End Date *
                          </label>
                          <input
                            type="date"
                            required
                            disabled={selectedProgram.isPublished}
                            value={metaForm.endDate}
                            onChange={(e) => {
                              const newEnd = e.target.value;
                              const s = new Date(metaForm.startDate);
                              const en = new Date(newEnd);
                              const days =
                                !isNaN(s.getTime()) && !isNaN(en.getTime()) && en >= s
                                  ? Math.max(1, Math.round((en.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1)
                                  : 1;
                              setMetaForm((p) => ({
                                ...p,
                                endDate: newEnd,
                                durationDays: days,
                              }));
                            }}
                            className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs font-mono text-zinc-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-zinc-400"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                              Registration Open Date
                            </label>
                            <label className="flex items-center gap-1.5 text-[11px] text-zinc-500 cursor-pointer">
                              <input
                                type="checkbox"
                                disabled={selectedProgram.isPublished}
                                checked={metaForm.isTbaOpenDate}
                                onChange={(e) =>
                                  setMetaForm((p) => ({
                                    ...p,
                                    isTbaOpenDate: e.target.checked,
                                    registrationOpenDate: e.target.checked ? "" : p.registrationOpenDate,
                                  }))
                                }
                                className="rounded text-zinc-900 focus:ring-zinc-400 border-zinc-300 dark:border-zinc-700 bg-transparent disabled:opacity-60"
                              />
                              <span>TBA</span>
                            </label>
                          </div>
                          <input
                            type="date"
                            disabled={metaForm.isTbaOpenDate || selectedProgram.isPublished}
                            value={metaForm.registrationOpenDate}
                            onChange={(e) =>
                              setMetaForm((p) => ({
                                ...p,
                                registrationOpenDate: e.target.value,
                                isTbaOpenDate: false,
                              }))
                            }
                            className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs font-mono text-zinc-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-zinc-400"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            Registration Cutoff Date *
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
                            className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs font-mono text-zinc-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-zinc-400"
                          />
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        Duration is automatically calculated from the date range ({metaForm.durationDays} days). If shortened, schedule entries beyond Day {metaForm.durationDays} will be trimmed. If extended, existing saved days are preserved.
                      </div>
                    </div>

                    {/* SECTION 4: ATTENDANCE MODE */}
                    <div className="space-y-5 pt-6 border-t border-zinc-100 dark:border-white/10">
                      <div className="border-b border-zinc-100 dark:border-white/10 pb-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                          4. Attendance Mode
                        </h3>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                          Delivery format (Online, On-Site studio, or Online + Onsite hybrid)
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="grid sm:grid-cols-3 gap-3">
                          {[
                            { key: "ONLINE", label: "Online" },
                            { key: "ONSITE", label: "On-Site" },
                            { key: "HYBRID", label: "Online + Onsite" },
                          ].map((mode) => (
                            <button
                              key={mode.key}
                              type="button"
                              disabled={selectedProgram.isPublished}
                              onClick={() =>
                                setMetaForm((p) => ({
                                  ...p,
                                  locationType: mode.key as "ONLINE" | "ONSITE" | "HYBRID",
                                }))
                              }
                              className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed ${
                                metaForm.locationType === mode.key
                                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs border-transparent"
                                  : "bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                              }`}
                            >
                              {mode.label}
                            </button>
                          ))}
                        </div>

                        {metaForm.locationType !== "ONLINE" && (
                          <div className="grid sm:grid-cols-2 gap-5 pt-2">
                            <div className="space-y-2">
                              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                City / Metropolitan Area *
                              </label>
                              <input
                                type="text"
                                required
                                disabled={selectedProgram.isPublished}
                                value={metaForm.city}
                                onChange={(e) =>
                                  setMetaForm((p) => ({ ...p, city: e.target.value }))
                                }
                                placeholder="e.g. Jakarta Selatan"
                                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                Studio Physical Venue Address
                              </label>
                              <input
                                type="text"
                                disabled={selectedProgram.isPublished}
                                value={metaForm.venueAddress}
                                onChange={(e) =>
                                  setMetaForm((p) => ({ ...p, venueAddress: e.target.value }))
                                }
                                placeholder="e.g. The BMS Studio, Jl. Senopati No. 18"
                                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SECTION 5: PRICING & QUOTA */}
                    <div className="space-y-5 pt-6 border-t border-zinc-100 dark:border-white/10">
                      <div className="border-b border-zinc-100 dark:border-white/10 pb-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                          5. Pricing &amp; Participant Quota
                        </h3>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                          Enrollment capacity, base price, and optional discount incentive
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            Participant Capacity (Seats) *
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
                            className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs font-mono text-zinc-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-zinc-400"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            Actual Tuition (IDR) *
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            required
                            disabled={selectedProgram.isPublished}
                            value={metaForm.actualPrice}
                            onChange={(e) => {
                              const actual = Number(e.target.value) || 0;
                              const disc = Number(metaForm.discountPercentage) || 0;
                              setMetaForm((p) => ({
                                ...p,
                                actualPrice: actual,
                                price: Math.max(0, Math.round(actual * (1 - disc / 100))),
                              }));
                            }}
                            className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs font-mono text-zinc-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-zinc-400"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            Discount (5% Multiples)
                          </label>
                          <select
                            disabled={selectedProgram.isPublished}
                            value={metaForm.discountPercentage}
                            onChange={(e) => {
                              const disc = Number(e.target.value) || 0;
                              const actual = Number(metaForm.actualPrice) || 0;
                              setMetaForm((p) => ({
                                ...p,
                                discountPercentage: disc,
                                price: Math.max(0, Math.round(actual * (1 - disc / 100))),
                              }));
                            }}
                            className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs font-mono text-zinc-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-zinc-400"
                          >
                            {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((pct) => (
                              <option key={pct} value={pct} className="bg-white dark:bg-zinc-900">
                                {pct === 0 ? "0% (No Discount)" : `${pct}% Off`}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            Final Calculated Tuition
                          </label>
                          <div className="w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-white/10 border border-zinc-200 dark:border-white/10 text-xs font-mono font-bold text-zinc-900 dark:text-white">
                            {metaForm.price === 0
                              ? "Free"
                              : `Rp ${metaForm.price.toLocaleString("id-ID")}`}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 6: COMMUNITY CHANNEL LINK */}
                    <div className="space-y-5 pt-6 border-t border-zinc-100 dark:border-white/10">
                      <div className="border-b border-zinc-100 dark:border-white/10 pb-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                          6. Community Channel / Group URL
                        </h3>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                          Private group or channel link for enrolled members (WhatsApp, Discord, LINE, WeChat, Slack, Telegram)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          Community Channel / Group URL
                        </label>
                        <input
                          type="url"
                          disabled={selectedProgram.isPublished}
                          value={metaForm.communityLink}
                          onChange={(e) =>
                            setMetaForm((p) => ({ ...p, communityLink: e.target.value }))
                          }
                          placeholder="https://chat.whatsapp.com/..., discord.gg/..., line.me/..., etc."
                          className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-zinc-100 dark:border-white/10">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {selectedProgram.isPublished
                          ? "Program is currently live. Unpublish to adjust core schedule, quota, or pricing parameters."
                          : "Save updates to program information. All daily routines will adjust to new duration."}
                      </span>

                      {selectedProgram.isPublished ? (
                        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                          <Lock className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Terms locked while live</span>
                        </div>
                      ) : (
                        <button
                          type="submit"
                          disabled={savingMeta}
                          className="px-6 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium flex items-center gap-2 shadow-xs hover:opacity-90 transition disabled:opacity-50"
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

                    {metaError && (
                      <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-400 animate-in fade-in duration-200">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div className="flex-1 font-medium">{metaError}</div>
                      </div>
                    )}
                  </form>
                </div>
              )}

              {/* ============================================================= */}
              {/* TAB 2: DAILY SCHEDULE CURRICULUM                              */}
              {/* ============================================================= */}
              {programDetailTab === "schedule" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Day Selector Card */}
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
                <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-6 sm:p-7 border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                        Daily Schedule
                      </h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        <span className="font-mono">{filledCount}</span> of <span className="font-mono">{targetDays}</span> days scheduled
                      </p>
                    </div>

                    {totalDayBatches > 1 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDayBatchPage(Math.max(1, safeBatch - 1))}
                          disabled={safeBatch <= 1}
                          className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-medium text-zinc-700 dark:text-zinc-300 disabled:opacity-40 transition"
                        >
                          Prev
                        </button>
                        <span className="text-xs font-mono text-zinc-500 px-2">
                          Days {(safeBatch - 1) * DAY_BATCH_SIZE + 1} –{" "}
                          {Math.min(targetDays, safeBatch * DAY_BATCH_SIZE)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setDayBatchPage(Math.min(totalDayBatches, safeBatch + 1))
                          }
                          disabled={safeBatch >= totalDayBatches}
                          className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-medium text-zinc-700 dark:text-zinc-300 disabled:opacity-40 transition"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Clean Day Pills (Max 3 per row for spacious readability) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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
                          className={`px-3.5 py-3 rounded-xl text-left transition flex flex-col justify-between gap-1.5 min-h-[64px] border ${
                            isSelected
                              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs border-transparent"
                              : filled
                              ? "bg-zinc-50 dark:bg-white/5 border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/10"
                              : "bg-zinc-50/40 dark:bg-white/[0.02] border-zinc-200/50 dark:border-white/5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 w-full">
                            <span className="text-xs font-medium whitespace-nowrap shrink-0">
                              Day {dayNum}
                            </span>

                            {filled ? (
                              <span
                                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? "bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white"
                                    : "bg-zinc-900/10 text-zinc-900 dark:bg-white/20 dark:text-white"
                                }`}
                              >
                                <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                              </span>
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-30 shrink-0" />
                            )}
                          </div>

                          <span className="text-[11px] opacity-70 truncate block w-full font-normal">
                            {filled ? cleanSubtitle || "Configured" : "Unset"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Day Content Form */}
            <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-6 sm:p-8 space-y-8 border border-zinc-200/80 dark:border-white/10 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-white/10 pb-5">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                    Day {selectedDayNum} Protocol • Curriculum Blueprint
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Configure daily training sequence, recovery guidance, meals, and push reminders
                  </p>
                </div>

                {selectedProgram.days.some(
                  (d) => d.dayNumber === selectedDayNum
                ) && (
                  <button
                    type="button"
                    onClick={() => handleClearDay(selectedProgram)}
                    disabled={savingDay}
                    className="px-3.5 py-1.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-medium flex items-center gap-1.5 w-fit whitespace-nowrap transition border border-red-200/60 dark:border-red-900/40"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Clear Day {selectedDayNum}</span>
                  </button>
                )}
              </div>

              {/* SECTION 1: DAY IDENTITY & ACTIVITY CATEGORY */}
              <div className="space-y-5">
                <div className="border-b border-zinc-100 dark:border-white/10 pb-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                    1. Ritual Cadence &amp; Daily Category
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Day title, focus mode (Training, Rest, or Connection), coach assignment, and goal
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Day Title *
                    </label>
                    <input
                      type="text"
                      placeholder={`e.g. Day ${selectedDayNum}: Core & Mobility Sequence`}
                      value={dayForm.title}
                      onChange={(e) =>
                        setDayForm((p) => ({ ...p, title: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Discipline Category *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          {
                            value: "TRAINING_DAY",
                            label: "Training",
                            icon: Dumbbell,
                          },
                          {
                            value: "REST_DAY",
                            label: "Rest",
                            icon: Coffee,
                          },
                          {
                            value: "CONNECTION_DAY",
                            label: "Connect",
                            icon: MapPin,
                          },
                        ] as const
                      ).map((typeOpt) => {
                        const Icon = typeOpt.icon;
                        const active =
                          dayForm.dayType === typeOpt.value ||
                          (typeOpt.value === "CONNECTION_DAY" && dayForm.dayType === "MEETUP_DAY");
                        return (
                          <button
                            key={typeOpt.value}
                            type="button"
                            onClick={() =>
                              setDayForm((p) => ({
                                ...p,
                                dayType: typeOpt.value,
                                dayNotifications: getDefaultNotificationsForType(typeOpt.value),
                              }))
                            }
                            className={`py-2 px-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
                              active
                                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs"
                                : "bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
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

                {/* Assigned Coach & Focus Target for Today (Hidden for REST_DAY) */}
                {dayForm.dayType !== "REST_DAY" && (
                  <div className="grid md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>Assigned Coach for Day {selectedDayNum}</span>
                      </label>

                      <select
                        value={dayForm.coachName}
                        onChange={(e) => setDayForm((p) => ({ ...p, coachName: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                      >
                        <option value="">— Select Coach for Today —</option>
                        {parseTagList(selectedProgram.coachName).map((coach, idx) => (
                          <option key={idx} value={coach}>
                            {coach}
                          </option>
                        ))}
                        {masterData.coaches
                          .filter((mc) => !parseTagList(selectedProgram.coachName).includes(mc.name))
                          .map((mc) => (
                            <option key={mc.id} value={mc.name}>
                              {mc.name} ({mc.title})
                            </option>
                          ))}
                      </select>

                      {parseTagList(selectedProgram.coachName).length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {parseTagList(selectedProgram.coachName).map((coach, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setDayForm((p) => ({ ...p, coachName: coach }))}
                              className={`px-2.5 py-1 rounded-lg text-xs transition ${
                                dayForm.coachName === coach
                                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-medium"
                                  : "bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                              }`}
                            >
                              {coach}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>Day Focus &amp; Target Goal</span>
                      </label>

                      <select
                        value={dayForm.recommendedFor}
                        onChange={(e) => setDayForm((p) => ({ ...p, recommendedFor: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
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
                          {parseTagList(selectedProgram.recommendedFor).map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setDayForm((p) => ({ ...p, recommendedFor: item }))}
                              className={`px-2.5 py-1 rounded-lg text-xs transition ${
                                dayForm.recommendedFor === item
                                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-medium"
                                  : "bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
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
              </div>

              {/* SECTION 2: CIRCADIAN SLEEP RECOMMENDATION */}
              <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-zinc-400 shrink-0" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                    2. Circadian Sleep Recommendation
                  </h4>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Target 8 Hours • Wind down before 22:30"
                  value={dayForm.sleepRecommendation}
                  onChange={(e) =>
                    setDayForm((p) => ({ ...p, sleepRecommendation: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                />
                <p className="text-[11px] text-zinc-400 font-light">
                  Displayed on the member&apos;s Morning Awakening &amp; Evening Wind-down cockpit card.
                </p>
              </div>

              {/* SECTION 3: CURRICULUM DETAILS (TRAINING / REST / CONNECTION) */}
              <div className="space-y-5 pt-4 border-t border-zinc-100 dark:border-white/10">
                <div className="border-b border-zinc-100 dark:border-white/10 pb-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                    3. {dayForm.dayType === "TRAINING_DAY"
                      ? "Movement Sequences, Video & Nutrition"
                      : dayForm.dayType === "REST_DAY"
                      ? "Parasympathetic Decompression & Nutrition"
                      : "Studio Venue, Virtual Stream & Nutrition"}
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Prescribed routines, video coaching resources, and dietary guidance
                  </p>
                </div>

                {dayForm.dayType === "TRAINING_DAY" && (
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>YouTube Premium Video Link (Subscribers Only)</span>
                        </label>
                        <input
                          type="url"
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={dayForm.videoUrl}
                          onChange={(e) =>
                            setDayForm((p) => ({ ...p, videoUrl: e.target.value }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                        />
                        <p className="text-[11px] text-zinc-400 font-light">
                          Opens directly in member&apos;s app with subscriber verification.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                          <Utensils className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>Meal Recommendation &amp; Nutrition Guide</span>
                        </label>
                        <textarea
                          rows={4}
                          placeholder="Recommended meals and anti-inflammatory hydration for today..."
                          value={dayForm.mealRecommendation}
                          onChange={(e) =>
                            setDayForm((p) => ({
                              ...p,
                              mealRecommendation: e.target.value,
                            }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <MultiTagInput
                        label="Workout Options for Member Selection"
                        subLabel="Workout modalities selectable by members (press Enter to add)"
                        placeholder="e.g. Hot Pilates, Strength Workout, Outdoor Running"
                        value={stringifyTagList(dayForm.workoutOptions)}
                        onChange={(val) => setDayForm((p) => ({ ...p, workoutOptions: parseTagList(val) }))}
                        icon={Dumbbell}
                        chipColor="zinc"
                        quickSuggestions={[
                          "Hot Pilates",
                          "Strength Workout",
                          "Outdoor Running",
                          "Yoga & Mobility Flow",
                          "Cardio / HIIT",
                          "Custom Routine",
                        ]}
                      />

                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                              Movement Checklist &amp; Target Reps
                            </label>
                            <p className="text-[11px] text-zinc-400">
                              Format: Exercise = Target (e.g. Push-ups = 30 reps). Members record their actual reps in dashboard.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setDayForm((p) => ({
                                ...p,
                                videoChecklist: [...p.videoChecklist, ""],
                              }))
                            }
                            className="text-xs font-medium text-zinc-900 dark:text-white hover:text-zinc-600 flex items-center gap-1 transition shrink-0"
                          >
                            <Plus className="w-3 h-3 shrink-0" /> Add Item
                          </button>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {[
                            "Push-ups = 30 reps",
                            "Sit-ups = 50 reps",
                            "Pull-ups = 10 reps",
                            "Squats = 40 reps",
                            "Plank = 60 secs",
                          ].map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                if (!dayForm.videoChecklist.includes(preset)) {
                                  setDayForm((p) => ({
                                    ...p,
                                    videoChecklist: p.videoChecklist.filter(Boolean).length === 0
                                      ? [preset]
                                      : [...p.videoChecklist, preset],
                                  }));
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-400 text-[11px] font-mono transition"
                            >
                              + {preset}
                            </button>
                          ))}
                        </div>

                        <div className="space-y-2">
                          {dayForm.videoChecklist.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Exercise = Target Reps (e.g. Push-ups = 30 reps)"
                                value={item}
                                onChange={(e) => {
                                  const next = [...dayForm.videoChecklist];
                                  next[idx] = e.target.value;
                                  setDayForm((p) => ({ ...p, videoChecklist: next }));
                                }}
                                className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
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
                                  className="p-2 rounded-lg text-zinc-400 hover:text-red-500 transition shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {dayForm.dayType === "REST_DAY" && (
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Parasympathetic Restoration Guide
                      </label>
                      <textarea
                        rows={5}
                        placeholder="Gentle walk instructions, box breathing, foam rolling..."
                        value={dayForm.restInstructions}
                        onChange={(e) =>
                          setDayForm((p) => ({
                            ...p,
                            restInstructions: e.target.value,
                          }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Rest Day Meal &amp; Hydration Guide
                      </label>
                      <textarea
                        rows={5}
                        placeholder="Electrolyte hydration, restorative herbal tea, clean eating..."
                        value={dayForm.mealRecommendation}
                        onChange={(e) =>
                          setDayForm((p) => ({
                            ...p,
                            mealRecommendation: e.target.value,
                          }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                      />
                    </div>
                  </div>
                )}

                {(dayForm.dayType === "CONNECTION_DAY" || dayForm.dayType === "MEETUP_DAY") && (
                  <div className="space-y-5">
                    {/* Row 1: Event Title & Schedule (Max 2 columns) */}
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          Event / Meetup Title *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. BMS Community Studio Flow & Mindful Brunch"
                          value={dayForm.eventTitle}
                          onChange={(e) =>
                            setDayForm((p) => ({
                              ...p,
                              eventTitle: e.target.value,
                            }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          Session Schedule (Time) *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 09:00 AM – 11:30 AM WIB"
                          value={dayForm.onsiteSchedule}
                          onChange={(e) =>
                            setDayForm((p) => ({
                              ...p,
                              onsiteSchedule: e.target.value,
                            }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                        />
                      </div>
                    </div>

                    {/* Row 2: Studio Venue & Google Maps Link (Max 2 columns) */}
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          Location / Studio Venue *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. The BMS Sanctuary Studio, Senopati, Jakarta"
                          value={dayForm.onsiteVenue}
                          onChange={(e) =>
                            setDayForm((p) => ({
                              ...p,
                              onsiteVenue: e.target.value,
                            }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          Google Maps Link (Venue URL)
                        </label>
                        <input
                          type="url"
                          placeholder="https://maps.app.goo.gl/..."
                          value={dayForm.mapLink}
                          onChange={(e) =>
                            setDayForm((p) => ({
                              ...p,
                              mapLink: e.target.value,
                            }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                        />
                      </div>
                    </div>

                    {/* Row 3: Event Host & Virtual Fallback Link (Max 2 columns) */}
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          Who Members Will Meet (Host / Coach)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Coach Maria & Founder Sarah"
                          value={dayForm.eventHost}
                          onChange={(e) =>
                            setDayForm((p) => ({
                              ...p,
                              eventHost: e.target.value,
                            }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          Virtual Broadcast Link (Remote Fallback)
                        </label>
                        <input
                          type="url"
                          placeholder="https://meet.google.com/..."
                          value={dayForm.meetupLink}
                          onChange={(e) =>
                            setDayForm((p) => ({
                              ...p,
                              meetupLink: e.target.value,
                            }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                        />
                      </div>
                    </div>

                    {/* Row 4: Event Details & Rundown */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Event Details &amp; Agenda Rundown
                      </label>
                      <textarea
                        rows={3}
                        placeholder="e.g. 09:00 Arrival & herbal hydration, 09:30 Guided community flow, 10:30 Group reflection & networking brunch..."
                        value={dayForm.eventDetails}
                        onChange={(e) =>
                          setDayForm((p) => ({
                            ...p,
                            eventDetails: e.target.value,
                          }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                      />
                    </div>

                    {/* Row 5: Food Recommendation for Connect Day */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Connect Day Meal &amp; Hydration Recommendation
                      </label>
                      <textarea
                        rows={3}
                        placeholder="e.g. Pre-event electrolyte hydration and post-meetup high-protein recovery brunch..."
                        value={dayForm.mealRecommendation}
                        onChange={(e) =>
                          setDayForm((p) => ({
                            ...p,
                            mealRecommendation: e.target.value,
                          }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 4: DAILY PUSH NOTIFICATIONS DISPATCH */}
              <div className="space-y-5 pt-4 border-t border-zinc-100 dark:border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-zinc-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                        4. Scheduled Push Dispatches ({dayForm.dayNotifications?.length || 0})
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {dayForm.dayType === "REST_DAY" ? "2 Reminders configured for rest day" : "3 Reminders configured for full day routine"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(dayForm.dayNotifications || []).map((notif, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl p-4 space-y-3 bg-zinc-50/70 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/10"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-white/10 text-zinc-800 dark:text-zinc-200 text-[10px] uppercase tracking-wider font-semibold">
                          {notif.label || `Reminder ${idx + 1}`}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          <input
                            type="time"
                            value={notif.time}
                            onChange={(e) => {
                              const updated = [...dayForm.dayNotifications];
                              updated[idx] = { ...updated[idx], time: e.target.value };
                              setDayForm((p) => ({ ...p, dayNotifications: updated }));
                            }}
                            className="px-2 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-xs font-mono font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-zinc-500">
                          Notification Message
                        </label>
                        <textarea
                          rows={3}
                          value={notif.message}
                          onChange={(e) => {
                            const updated = [...dayForm.dayNotifications];
                            updated[idx] = { ...updated[idx], message: e.target.value };
                            setDayForm((p) => ({ ...p, dayNotifications: updated }));
                          }}
                          placeholder="Notification message body..."
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-4 border-t border-zinc-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
                <span className="text-[11px] text-zinc-400">
                  Changes save directly to program schedule in the SQLite database.
                </span>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSaveDay(selectedProgram, false)}
                    disabled={savingDay}
                    className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-900 dark:text-white text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition disabled:opacity-50"
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
                      className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium flex items-center gap-2 whitespace-nowrap shadow-xs hover:opacity-90 transition disabled:opacity-50"
                    >
                      {savingDay ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      ) : (
                        <>
                          <span>Save &amp; Next Day</span>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {dayError && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-400 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{dayError}</div>
                </div>
              )}
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
            <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-4 border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                />
              </div>

              <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 w-fit">
                {(["ALL", "ACTIVE", "PENDING"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => {
                      setMemberFilter(f);
                      setMemberPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                      memberFilter === f
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    {f === "ALL" ? "All Customers" : f === "ACTIVE" ? "Active" : "Pending"}
                  </button>
                ))}
              </div>
            </div>

            {/* Customers Table Widget */}
            <div className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200/80 dark:border-white/10 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                  Customers Directory ({filteredMembers.length})
                </h2>
                <span className="text-[11px] text-zinc-400 hidden sm:inline">
                  Manage customer account status, credentials, and program enrollments
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-white/10 text-[10px] uppercase tracking-wider text-zinc-400">
                      <th className="py-3 px-6 font-semibold whitespace-nowrap">Customer</th>
                      <th className="py-3 px-6 font-semibold whitespace-nowrap">Phone</th>
                      <th className="py-3 px-6 font-semibold whitespace-nowrap">Enrolled Programs</th>
                      <th className="py-3 px-6 font-semibold text-right whitespace-nowrap">Account Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-white/5 text-xs">
                    {paginatedMembers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-14 text-center text-xs text-zinc-400"
                        >
                          No customers found.
                        </td>
                      </tr>
                    ) : (
                      paginatedMembers.map((m) => (
                        <tr
                          key={m.id}
                          className="hover:bg-zinc-50/70 dark:hover:bg-white/[0.02] transition"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-zinc-900 dark:text-white whitespace-nowrap">
                                {m.fullName}
                              </span>
                              {m.status === "SUSPENDED" && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-500 font-medium whitespace-nowrap">
                                  Suspended
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">
                              {m.email}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-[11px] text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                            {m.phone || "—"}
                          </td>
                          <td className="py-4 px-6">
                            {m.enrollments.length === 0 ? (
                              <span className="text-[11px] text-zinc-400">None</span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {m.enrollments.map((en) => (
                                  <span
                                    key={en.id}
                                    className={`text-[11px] px-2 py-0.5 rounded-md whitespace-nowrap ${
                                      en.status === "ACTIVE"
                                        ? "bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-zinc-100 font-medium"
                                        : "bg-zinc-100 dark:bg-white/5 text-zinc-500"
                                    }`}
                                  >
                                    {en.program.title}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            {m.id !== currentAdminId && (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleUserRole(m)}
                                  disabled={userActionLoading === m.id}
                                  className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 text-[11px] font-medium flex items-center gap-1 whitespace-nowrap transition"
                                  title={m.role === "SUPERADMIN" ? "Demote to Member" : "Promote to Superadmin"}
                                >
                                  <UserCheck className="w-3 h-3 shrink-0" />
                                  <span>{m.role === "SUPERADMIN" ? "Demote" : "Promote"}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleResetPassword(m)}
                                  disabled={userActionLoading === m.id}
                                  className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 text-[11px] font-medium flex items-center gap-1 whitespace-nowrap transition"
                                >
                                  <KeyRound className="w-3 h-3 shrink-0" />
                                  <span>Reset Pass</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleUserStatus(m)}
                                  disabled={userActionLoading === m.id}
                                  className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 text-[11px] font-medium flex items-center gap-1 whitespace-nowrap transition"
                                >
                                  <Ban className="w-3 h-3 shrink-0" />
                                  <span>{m.status === "ACTIVE" ? "Suspend" : "Activate"}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(m)}
                                  disabled={userActionLoading === m.id}
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1 transition"
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
            <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-4 border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={qrisSearch}
                  onChange={(e) => {
                    setQrisSearch(e.target.value);
                    setQrisPage(1);
                  }}
                  placeholder="Search payments by customer or program..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                />
              </div>

              <span className="text-xs text-zinc-400 whitespace-nowrap">
                <span className="font-mono text-zinc-800 dark:text-zinc-200 font-semibold">{pendingEnrollments.length}</span> pending verification
              </span>
            </div>

            {/* Payments List Widget */}
            <div className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200/80 dark:border-white/10 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/10">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                  Pending QRIS Payments
                </h2>
              </div>

              {paginatedQris.length === 0 ? (
                <div className="p-14 text-center space-y-2">
                  <CheckCircle2 className="w-6 h-6 text-zinc-300 dark:text-zinc-600 mx-auto" />
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                    All caught up
                  </p>
                  <p className="text-xs text-zinc-400">
                    There are no pending payments requiring admin review.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-white/5">
                  {paginatedQris.map((item) => (
                    <div
                      key={item.id}
                      className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:bg-zinc-50/70 dark:hover:bg-white/[0.02] transition"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                            {item.userFullName}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            {item.userEmail}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-700 dark:text-zinc-300">
                          {item.programTitle} •{" "}
                          <strong className="font-mono font-semibold text-zinc-900 dark:text-white">
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
                        className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap shadow-xs hover:opacity-90 transition disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-white/10 p-6 sm:p-8 text-zinc-900 dark:text-zinc-100">
            {publishModal.mode === "ERROR" ? (
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 block">
                      Publication Guard • Incomplete
                    </span>
                    <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                      Cannot Publish Program
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      To protect paying customers and maintain strict program integrity, all parameters and daily routines must be 100% completed before publishing.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 space-y-2">
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
                    className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium text-xs transition"
                  >
                    Close &amp; Fix Issues
                  </button>

                  {publishModal.missingDays && publishModal.missingDays.length > 0 && selectedProgram && (
                    <button
                      type="button"
                      onClick={() => {
                        setPublishModal(null);
                        setProgramDetailTab("schedule");
                        handleSelectDay(selectedProgram, publishModal.missingDays![0]);
                      }}
                      className="px-5 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium flex items-center gap-1.5 shadow-xs hover:opacity-90 transition"
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
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-zinc-100 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                      Strict Launch Guard
                    </span>
                    <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                      Confirm Program Launch &amp; Lock
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      Are you sure you want to activate and publish this program?
                    </p>
                  </div>
                </div>

                {selectedProgram && (
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/10 space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-white/10">
                      <span className="text-zinc-500">Program Title:</span>
                      <span className="font-semibold text-zinc-900 dark:text-white line-clamp-1 max-w-[200px]">
                        {selectedProgram.title}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Schedule Status:</span>
                      <span className="font-medium text-zinc-900 dark:text-white">
                        All <span className="font-mono">{selectedProgram.durationDays}</span> Days Complete
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Tuition Price:</span>
                      <span className="font-mono font-semibold text-zinc-900 dark:text-white">
                        Rp {selectedProgram.price.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Max Capacity:</span>
                      <span className="font-mono font-semibold text-zinc-900 dark:text-white">
                        {selectedProgram.maxQuota} Seats
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 flex items-start gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                  <Lock className="w-4 h-4 shrink-0 mt-0.5 text-zinc-400" />
                  <p className="leading-relaxed">
                    <strong className="text-zinc-900 dark:text-white font-medium">Immutability Notice:</strong> Once published, Program Information and pricing will be locked to prevent discrepancies with what customers paid for.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setPublishModal(null)}
                    className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium text-xs transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={publishingId === selectedProgram?.id}
                    onClick={() => {
                      if (selectedProgram) handleTogglePublish(selectedProgram, true);
                    }}
                    className="px-5 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium transition flex items-center gap-2 shadow-xs hover:opacity-90 disabled:opacity-50"
                  >
                    {publishingId === selectedProgram?.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Confirm &amp; Launch Program</span>
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
