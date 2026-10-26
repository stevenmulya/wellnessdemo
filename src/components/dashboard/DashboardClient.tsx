"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { QrisCheckoutModal, QrisInvoiceData } from "@/components/checkout/QrisCheckoutModal";
import {
  wellnessUpdateProfile,
  wellnessChangePassword,
  wellnessEnrollProgram,
  wellnessDeleteAccount,
} from "@/wellness/actions/account";
import { wellnessSignOut } from "@/wellness/actions/auth";
import { wellnessUserSubmitDayProgress } from "@/wellness/actions/program";
import { normalizeVideoEmbed } from "@/wellness/integrations/video-provider";
import {
  CheckCircle,
  Clock,
  Lock,
  Loader2,
  Shield,
  LogOut,
  Eye,
  EyeOff,
  Video,
  Utensils,
  CheckSquare,
  Square,
  ExternalLink,
  ArrowRight,
  Play,
  AlertTriangle,
  MessageCircle,
  MapPin,
  Bell,
  Smartphone,
  QrCode,
  ShieldCheck,
  X,
  Sparkles,
  Info,
  Calendar,
  Compass,
  Sliders,
  User,
  Users,
} from "lucide-react";

export interface ProgramDayItem {
  id: string;
  dayNumber: number;
  title: string;
  dayType: string;
  unlockDate: string;
  isCalendarUnlocked: boolean;
  isPast2359: boolean;
  isSkipped: boolean;
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
  userProgress?: {
    id: string;
    videoWatched: boolean;
    isCompleted: boolean;
    checklistCompleted: string | null;
    assessmentResponse: string | null;
  } | null;
}

export interface ProgramItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  recommendedFor?: string;
  coachName: string;
  durationDays?: number;
  price: number;
  maxQuota: number;
  enrolledCount: number;
  locationType?: string;
  city?: string | null;
  venueAddress?: string | null;
  virtualFallbackAvailable?: boolean;
  communityLink: string | null;
  startDate: Date | string;
  endDate: Date | string;
  registrationDeadline: Date | string;
  dayCount: number;
  days: ProgramDayItem[];
}

export interface EnrollmentItem {
  enrollmentId: string;
  programId: string;
  title: string;
  slug: string;
  description: string;
  coachName: string;
  price: number;
  maxQuota: number;
  locationType?: string;
  city?: string | null;
  venueAddress?: string | null;
  virtualFallbackAvailable?: boolean;
  attendanceMode?: string;
  communityLink: string | null;
  dayCount: number;
  startDate: Date | string;
  endDate: Date | string;
  registrationDeadline: Date | string;
  status: string;
  paymentReference: string | null;
  invoiceExpiresAt: Date | string | null;
  paidAt: Date | string | null;
  validUntil: Date | string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  status: string;
  createdAt: Date | string;
}

interface DashboardProps {
  user: UserProfile;
  myPrograms: EnrollmentItem[];
  allPrograms: ProgramItem[];
}

export function DashboardClient({ user, myPrograms, allPrograms }: DashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"my_plan" | "all_plan" | "setting">("my_plan");

  // Filter ONLY programs the user has enrolled in
  const enrolledProgramIds = new Set(myPrograms.map((e) => e.programId));
  const myEnrolledPrograms = allPrograms.filter((p) => enrolledProgramIds.has(p.id));

  const activeEnrollment = myPrograms.find((e) => e.status === "ACTIVE") || myPrograms[0];
  const defaultProgramId = activeEnrollment?.programId || myEnrolledPrograms[0]?.id || "";
  const [selectedProgId, setSelectedProgId] = useState<string>(defaultProgramId);

  const initialProg =
    myEnrolledPrograms.find((p) => p.id === defaultProgramId) ||
    myEnrolledPrograms[0] ||
    null;
  const initialTodayIdx = initialProg
    ? Math.max(
        0,
        initialProg.days.reduce(
          (acc, d, idx) => (d.isCalendarUnlocked && !d.isPast2359 ? idx : acc),
          0
        )
      )
    : 0;
  const [activeDayIndex, setActiveDayIndex] = useState<number>(initialTodayIdx);

  const [dayChecklists, setDayChecklists] = useState<Record<string, string[]>>({});
  const [dayVideoWatched, setDayVideoWatched] = useState<Record<string, boolean>>({});
  const [dayAssessments, setDayAssessments] = useState<Record<string, string>>({});
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [qrisInvoice, setQrisInvoice] = useState<QrisInvoiceData | null>(null);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const [notifPermission, setNotifPermission] = useState<string>(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default"
  );
  const [morningTime, setMorningTime] = useState("07:00");
  const [eveningTime, setEveningTime] = useState("20:30");

  // Profile Settings States
  const [profileForm, setProfileForm] = useState({
    fullName: user.fullName,
    phone: user.phone || "",
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password Form States & Peek
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [peekCurrentPass, setPeekCurrentPass] = useState(false);
  const [peekNewPass, setPeekNewPass] = useState(false);
  const [peekConfirmPass, setPeekConfirmPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Delete Account States & Peek
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [peekDeletePass, setPeekDeletePass] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Program Detail Explanation Modal
  const [detailedProgram, setDetailedProgram] = useState<ProgramItem | null>(null);

  const handleSignOut = async () => {
    await wellnessSignOut();
    router.push("/");
    router.refresh();
  };

  const currentProgram =
    myEnrolledPrograms.find((p) => p.id === selectedProgId) ||
    myEnrolledPrograms[0] ||
    null;
  const currentEnrollment = currentProgram
    ? myPrograms.find((e) => e.programId === currentProgram.id)
    : null;
  const hasActiveAccess = currentEnrollment?.status === "ACTIVE";
  const currentDay = currentProgram?.days?.[activeDayIndex] || currentProgram?.days?.[0] || null;

  const getCheckedItems = (day: ProgramDayItem): string[] => {
    if (dayChecklists[day.id] !== undefined) {
      return dayChecklists[day.id];
    }
    if (day.userProgress?.checklistCompleted) {
      try {
        return JSON.parse(day.userProgress.checklistCompleted);
      } catch {
        return [];
      }
    }
    return [];
  };

  const getVideoWatched = (day: ProgramDayItem): boolean => {
    if (dayVideoWatched[day.id] !== undefined) {
      return dayVideoWatched[day.id];
    }
    return !!day.userProgress?.videoWatched || !!day.userProgress?.isCompleted;
  };

  const handleToggleVideoWatched = async () => {
    if (!currentDay) return;
    const prevVideo = getVideoWatched(currentDay);
    const nextVideo = !prevVideo;
    setDayVideoWatched((prev) => ({ ...prev, [currentDay.id]: nextVideo }));

    const checked = getCheckedItems(currentDay);
    const allTasksDone =
      currentDay.videoChecklist.length === 0 ||
      currentDay.videoChecklist.every((t) => checked.includes(t));
    const autoComplete = nextVideo && allTasksDone;

    const res = await wellnessUserSubmitDayProgress({
      programDayId: currentDay.id,
      videoWatched: nextVideo,
      checklistCompleted: checked,
      isCompleted: autoComplete,
      assessmentResponse:
        dayAssessments[currentDay.id] !== undefined
          ? dayAssessments[currentDay.id]
          : currentDay.userProgress?.assessmentResponse || "",
    });

    if (!res.success) {
      // Rollback optimistic state
      setDayVideoWatched((prev) => ({ ...prev, [currentDay.id]: prevVideo }));
      setActionNotice({
        type: "error",
        text: res.message || "Failed to save video progress.",
      });
      setTimeout(() => setActionNotice(null), 4000);
      return;
    }

    if (autoComplete) {
      setActionNotice({
        type: "success",
        text: `Day ${currentDay.dayNumber} completed.`,
      });
      setTimeout(() => setActionNotice(null), 3500);
    }
    router.refresh();
  };

  const handleToggleChecklist = async (task: string) => {
    if (!currentDay) return;
    const existing = getCheckedItems(currentDay);
    const updated = existing.includes(task)
      ? existing.filter((t) => t !== task)
      : [...existing, task];

    setDayChecklists((prev) => ({ ...prev, [currentDay.id]: updated }));

    const videoDone =
      currentDay.dayType !== "TRAINING_DAY" || !currentDay.videoUrl
        ? true
        : getVideoWatched(currentDay);
    const allTasksDone =
      currentDay.videoChecklist.length > 0 &&
      currentDay.videoChecklist.every((t) => updated.includes(t));

    const autoComplete = videoDone && allTasksDone;

    const res = await wellnessUserSubmitDayProgress({
      programDayId: currentDay.id,
      videoWatched: getVideoWatched(currentDay),
      checklistCompleted: updated,
      isCompleted: autoComplete || !!currentDay.userProgress?.isCompleted,
      assessmentResponse:
        dayAssessments[currentDay.id] !== undefined
          ? dayAssessments[currentDay.id]
          : currentDay.userProgress?.assessmentResponse || "",
    });

    if (!res.success) {
      // Rollback optimistic state
      setDayChecklists((prev) => ({ ...prev, [currentDay.id]: existing }));
      setActionNotice({
        type: "error",
        text: res.message || "Failed to update checklist item.",
      });
      setTimeout(() => setActionNotice(null), 4000);
      return;
    }

    if (autoComplete) {
      setActionNotice({
        type: "success",
        text: `Day ${currentDay.dayNumber} completed.`,
      });
      setTimeout(() => setActionNotice(null), 3500);
    }
    router.refresh();
  };

  const handleSaveAssessment = async () => {
    if (!currentDay) return;
    const responseText =
      dayAssessments[currentDay.id] !== undefined
        ? dayAssessments[currentDay.id]
        : currentDay.userProgress?.assessmentResponse || "";

    setIsSavingProgress(true);
    try {
      const res = await wellnessUserSubmitDayProgress({
        programDayId: currentDay.id,
        videoWatched: getVideoWatched(currentDay),
        assessmentResponse: responseText,
        checklistCompleted: getCheckedItems(currentDay),
        isCompleted: currentDay.userProgress?.isCompleted || false,
      });

      if (res.success) {
        setActionNotice({ type: "success", text: "Daily note saved." });
        setTimeout(() => setActionNotice(null), 3000);
      } else {
        setActionNotice({
          type: "error",
          text: res.message || "Failed to save daily note.",
        });
        setTimeout(() => setActionNotice(null), 4000);
      }
    } finally {
      setIsSavingProgress(false);
    }
  };

  const handleToggleCompleteDay = async () => {
    if (!currentDay) return;
    const currentCompleted = !!currentDay.userProgress?.isCompleted;
    const nextCompleted = !currentCompleted;

    const nextChecklist = nextCompleted
      ? currentDay.videoChecklist
      : getCheckedItems(currentDay);

    const prevVideo = getVideoWatched(currentDay);
    const prevChecklist = getCheckedItems(currentDay);

    setDayVideoWatched((prev) => ({ ...prev, [currentDay.id]: nextCompleted }));
    if (nextCompleted) {
      setDayChecklists((prev) => ({ ...prev, [currentDay.id]: currentDay.videoChecklist }));
    }

    setIsSavingProgress(true);
    try {
      const res = await wellnessUserSubmitDayProgress({
        programDayId: currentDay.id,
        videoWatched: nextCompleted,
        isCompleted: nextCompleted,
        checklistCompleted: nextChecklist,
        assessmentResponse:
          dayAssessments[currentDay.id] !== undefined
            ? dayAssessments[currentDay.id]
            : currentDay.userProgress?.assessmentResponse || "",
      });

      if (res.success) {
        setActionNotice({
          type: "success",
          text: nextCompleted
            ? `Day ${currentDay.dayNumber} marked as completed.`
            : `Day ${currentDay.dayNumber} reopened.`,
        });
        setTimeout(() => setActionNotice(null), 3000);
        router.refresh();
      } else {
        // Rollback
        setDayVideoWatched((prev) => ({ ...prev, [currentDay.id]: prevVideo }));
        setDayChecklists((prev) => ({ ...prev, [currentDay.id]: prevChecklist }));
        setActionNotice({
          type: "error",
          text: res.message || "Unable to update completion state.",
        });
        setTimeout(() => setActionNotice(null), 4000);
      }
    } finally {
      setIsSavingProgress(false);
    }
  };

  const handleOpenQrisCheckout = async (
    programId: string,
    mode: "IN_PERSON" | "VIRTUAL" = "VIRTUAL"
  ) => {
    setEnrollingId(programId);
    try {
      const res = await wellnessEnrollProgram(programId, mode);
      if (res.success && res.data) {
        setQrisInvoice(res.data);
      } else {
        setActionNotice({ type: "error", text: res.message || "Enrollment failed." });
        setTimeout(() => setActionNotice(null), 4000);
      }
    } finally {
      setEnrollingId(null);
    }
  };

  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "unauthorized_admin") {
      setActionNotice({
        type: "error",
        text: "Access denied: Superadmin privileges required to access the Admin Console.",
      });
      setTimeout(() => setActionNotice(null), 5000);
    }
    const enrollId = searchParams.get("enroll");
    if (enrollId) {
      handleOpenQrisCheckout(enrollId);
    }
  }, [searchParams]);

  const handleEnableNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setActionNotice({
        type: "error",
        text: "Browser notifications are not supported on this device.",
      });
      return;
    }
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === "granted") {
      new Notification("Wellness Reminders Enabled", {
        body: `Morning workout (${morningTime}) & evening checklist (${eveningTime}) reminders are active.`,
        icon: "/image.jpg",
      });
      setActionNotice({
        type: "success",
        text: "Daily reminder notifications enabled.",
      });
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  const handleTestReminder = (type: "morning" | "evening") => {
    const msg =
      type === "morning"
        ? currentDay?.pendingReminder ||
          "Good morning! Today's workout video and meal guide are ready."
        : "Evening Reminder: Complete your workout video and daily checklist before 23:59.";

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification(
        type === "morning" ? "Morning Workout Reminder" : "Evening Checklist Reminder",
        { body: msg, icon: "/image.jpg" }
      );
    }
    setActionNotice({ type: "success", text: msg });
    setTimeout(() => setActionNotice(null), 4500);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMsg(null);
    try {
      const res = await wellnessUpdateProfile(profileForm);
      if (res.success) {
        setProfileMsg({ type: "success", text: "Profile updated successfully." });
        router.refresh();
      } else {
        setProfileMsg({ type: "error", text: res.message || "Failed to update profile." });
      }
    } catch {
      setProfileMsg({ type: "error", text: "Connection error." });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (
      passwordForm.newPassword.length < 8 ||
      !/[A-Z]/.test(passwordForm.newPassword) ||
      !/\d/.test(passwordForm.newPassword)
    ) {
      setPasswordMsg({
        type: "error",
        text: "New password must be at least 8 characters with at least 1 uppercase letter and 1 number.",
      });
      return;
    }
    setIsChangingPass(true);
    setPasswordMsg(null);
    try {
      const res = await wellnessChangePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      if (res.success) {
        setPasswordMsg({ type: "success", text: "Password updated successfully." });
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setPasswordMsg({ type: "error", text: res.message || "Failed to update password." });
      }
    } catch {
      setPasswordMsg({ type: "error", text: "Connection error." });
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeletingAccount(true);
    setDeleteError(null);
    try {
      const res = await wellnessDeleteAccount({ password: deletePassword });
      if (res.success) {
        router.push("/?deleted=true");
      } else {
        setDeleteError(res.message || "Incorrect password.");
      }
    } catch {
      setDeleteError("Failed to delete account.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const completedDaysCount =
    currentProgram?.days?.filter((d) => d.userProgress?.isCompleted).length || 0;
  const skippedDaysCount =
    currentProgram?.days?.filter((d) => d.isSkipped && !d.userProgress?.isCompleted).length || 0;
  const totalDays = currentProgram?.days?.length || 0;
  const currentActiveCalendarDay =
    currentProgram?.days?.find((d) => d.isCalendarUnlocked && !d.isPast2359) ||
    currentProgram?.days?.[0];

  const formatShortDate = (iso: string | Date) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen text-zinc-900 dark:text-zinc-100 flex flex-col relative overflow-x-hidden silver-orange-canvas">
      {/* Top Glassmorphic Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 flex justify-center px-4 pt-3 pwa-header-safe pointer-events-none">
        <div className="pointer-events-auto blur-dock rounded-2xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-6 w-full max-w-6xl shadow-lg border border-white/60 dark:border-white/10 backdrop-blur-2xl">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs shadow-sm">
              W
            </span>
            <span className="font-semibold text-sm text-zinc-900 dark:text-white hidden xs:inline">
              Wellness
            </span>
          </Link>

          {/* Desktop Navigation (3 Menus: My Plan, All Plan, Setting) */}
          <nav className="hidden sm:flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setActiveTab("my_plan")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === "my_plan"
                  ? "chrome-button shadow-md"
                  : "text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>My Plan</span>
            </button>
            <button
              onClick={() => setActiveTab("all_plan")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === "all_plan"
                  ? "chrome-button shadow-md"
                  : "text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>All Plan</span>
            </button>
            <button
              onClick={() => setActiveTab("setting")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === "setting"
                  ? "chrome-button shadow-md"
                  : "text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Setting</span>
            </button>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />

            {user.role === "SUPERADMIN" && (
              <Link
                href="/admin"
                className="px-3 py-1.5 sm:py-2 rounded-xl glass-panel-subtle text-xs font-medium text-zinc-900 dark:text-zinc-100 hover:bg-white/60 dark:hover:bg-white/10 transition flex items-center gap-1.5"
                title="Admin Console"
              >
                <Shield className="w-3.5 h-3.5 text-orange-500" />
                <span className="hidden md:inline">Admin</span>
              </Link>
            )}

            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-2 rounded-xl text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile-First Bottom Navigation Dock (sm:hidden) */}
      <nav className="fixed bottom-3 left-4 right-4 z-40 sm:hidden flex justify-center pointer-events-none pwa-bottom-safe">
        <div className="pointer-events-auto blur-dock rounded-2xl p-1.5 flex items-center justify-around w-full max-w-sm shadow-2xl border border-white/70 dark:border-white/10 backdrop-blur-2xl">
          <button
            type="button"
            onClick={() => setActiveTab("my_plan")}
            className={`flex-1 py-2 px-2 rounded-xl flex flex-col items-center justify-center gap-1 transition ${
              activeTab === "my_plan"
                ? "chrome-button shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="text-[10px] font-semibold tracking-tight">My Plan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("all_plan")}
            className={`flex-1 py-2 px-2 rounded-xl flex flex-col items-center justify-center gap-1 transition ${
              activeTab === "all_plan"
                ? "chrome-button shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="text-[10px] font-semibold tracking-tight">All Plan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("setting")}
            className={`flex-1 py-2 px-2 rounded-xl flex flex-col items-center justify-center gap-1 transition ${
              activeTab === "setting"
                ? "chrome-button shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span className="text-[10px] font-semibold tracking-tight">Setting</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-36 sm:pb-24 flex-1 w-full space-y-6">
        {actionNotice && (
          <div
            className={`glass-panel p-4 rounded-2xl text-xs font-medium flex items-center gap-2.5 animate-in fade-in border ${
              actionNotice.type === "error"
                ? "border-red-500/30 text-red-700 dark:text-red-300"
                : "border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
            }`}
          >
            {actionNotice.type === "error" ? (
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            )}
            <span>{actionNotice.text}</span>
          </div>
        )}

        {/* TAB 1: DAILY CURRICULUM & BENTO GRID (ONLY ENROLLED COHORTS) */}
        {activeTab === "my_plan" && (
          <div className="space-y-6">
            {!currentProgram ? (
              /* Empty state if user has NOT enrolled in any program yet */
              <div className="relative rounded-3xl overflow-hidden glass-panel border border-white/60 dark:border-white/10 p-8 sm:p-14 text-center flex flex-col items-center justify-center space-y-5 shadow-xl min-h-[380px]">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <Image
                    src="/test.jpg"
                    alt=""
                    fill
                    className="object-cover scale-105 opacity-20 dark:opacity-10"
                  />
                </div>
                <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center relative z-10 shadow-sm">
                  <Calendar className="w-8 h-8" />
                </div>
                <div className="space-y-2 max-w-md relative z-10">
                  <span className="text-[10px] font-semibold px-3 py-1 rounded-full glass-image-overlay uppercase tracking-wider text-orange-400">
                    No Enrolled Plan
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    You haven&apos;t joined a cohort yet.
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    My Plan exclusively displays the cohorts you are participating in. Explore our active curriculums to unlock your daily workout videos, meal plans, and community channel.
                  </p>
                </div>
                <div className="relative z-10 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("all_plan")}
                    className="px-6 py-3 rounded-2xl chrome-button text-xs font-semibold inline-flex items-center gap-2 shadow-lg"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Explore All Plans</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Cohort Switcher (ONLY shown if user is enrolled in multiple programs) */}
                {myEnrolledPrograms.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 shrink-0">
                      Your Cohorts:
                    </span>
                    {myEnrolledPrograms.map((p) => {
                      const isSel = p.id === currentProgram.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedProgId(p.id);
                            setActiveDayIndex(0);
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition ${
                            isSel
                              ? "chrome-button shadow-sm"
                              : "glass-panel-subtle text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white"
                          }`}
                        >
                          {p.title}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Top 12-Column Glassmorphic Bento Header */}
                <div className="grid lg:grid-cols-12 gap-5 items-stretch">
                  {/* Program Overview Card with Full Background Image (7 Columns) */}
                  <div className="lg:col-span-7 relative rounded-3xl overflow-hidden glass-panel border border-white/60 dark:border-white/10 p-6 sm:p-8 flex flex-col justify-between group shadow-xl min-h-[260px]">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <Image
                        src="/test.jpg"
                        alt=""
                        fill
                        className="object-cover object-center scale-105 group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/30 pointer-events-none" />

                    <div className="space-y-3 relative z-10 text-white">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full glass-image-overlay uppercase tracking-wider text-orange-300">
                          My Enrolled Cohort
                        </span>
                        {hasActiveAccess ? (
                          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                            Active Member
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md">
                            Payment Required
                          </span>
                        )}

                        {currentProgram.locationType === "ONSITE" && (
                          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-amber-500/25 text-amber-200 border border-amber-400/30 backdrop-blur-md flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-300" />
                            <span>On-Site • {currentProgram.city || "Studio"}</span>
                          </span>
                        )}

                        {currentProgram.locationType === "HYBRID" && (
                          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-purple-500/25 text-purple-200 border border-purple-400/30 backdrop-blur-md flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-purple-300" />
                            <span>Hybrid • {currentProgram.city || "Studio"} & Live Stream</span>
                          </span>
                        )}

                        {(!currentProgram.locationType || currentProgram.locationType === "ONLINE") && (
                          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-blue-500/25 text-blue-200 border border-blue-400/30 backdrop-blur-md">
                            🌐 100% Online Cohort
                          </span>
                        )}
                      </div>

                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                        {currentProgram.title}
                      </h1>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-200">
                        {currentProgram.coachName && (
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-orange-400" />
                            <span>Lead: <strong className="font-semibold text-white">{currentProgram.coachName}</strong></span>
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-orange-400" />
                          <span>{formatShortDate(currentProgram.startDate)} – {formatShortDate(currentProgram.endDate)}</span>
                        </span>
                        {currentProgram.venueAddress && (
                          <span className="flex items-center gap-1.5 text-amber-200">
                            <MapPin className="w-3.5 h-3.5 text-amber-400" />
                            <span>Venue: {currentProgram.venueAddress}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-6 flex flex-wrap items-center justify-between gap-3 relative z-10">
                      {myEnrolledPrograms.length > 1 && (
                        <select
                          value={selectedProgId}
                          onChange={(e) => {
                            setSelectedProgId(e.target.value);
                            setActiveDayIndex(0);
                          }}
                          className="px-3.5 py-2 rounded-xl glass-image-overlay text-white text-xs font-medium border border-white/20 focus:outline-none"
                        >
                          {myEnrolledPrograms.map((p) => (
                            <option
                              key={p.id}
                              value={p.id}
                              className="bg-zinc-900 text-white"
                            >
                              {p.title}
                            </option>
                          ))}
                        </select>
                      )}

                      {!hasActiveAccess && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenQrisCheckout(currentProgram.id)}
                            disabled={enrollingId === currentProgram.id}
                            className="px-4 py-2 rounded-xl chrome-button text-xs font-semibold flex items-center gap-2 shadow-lg"
                          >
                            {enrollingId === currentProgram.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <QrCode className="w-4 h-4" /> Complete QRIS Payment
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right 2x2 Summary Metrics Bento Grid (5 Columns) */}
                  <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                    <div className="glass-panel p-5 rounded-3xl flex flex-col justify-between relative overflow-hidden">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                        Current Day
                      </span>
                      <p className="text-2xl font-bold text-zinc-900 dark:text-white my-1">
                        Day {currentActiveCalendarDay?.dayNumber || 1}{" "}
                        <span className="text-xs font-normal text-zinc-500">/ {totalDays}</span>
                      </p>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        00:00 Daily Unlock
                      </span>
                    </div>

                    <div className="glass-panel p-5 rounded-3xl flex flex-col justify-between relative overflow-hidden">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                        Completed
                      </span>
                      <p className="text-2xl font-bold text-zinc-900 dark:text-white my-1">
                        {completedDaysCount}{" "}
                        <span className="text-xs font-normal text-zinc-500">Days</span>
                      </p>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        {totalDays > 0 ? Math.round((completedDaysCount / totalDays) * 100) : 0}% Done
                      </span>
                    </div>

                    <div className="glass-panel p-5 rounded-3xl flex flex-col justify-between relative overflow-hidden">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                        Skipped Days
                      </span>
                      <p className="text-2xl font-bold text-zinc-900 dark:text-white my-1">
                        {skippedDaysCount}{" "}
                        <span className="text-xs font-normal text-zinc-500">Missed</span>
                      </p>
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        23:59 Cutoff
                      </span>
                    </div>

                    <div className="glass-panel p-5 rounded-3xl flex flex-col justify-between relative overflow-hidden">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                        Community
                      </span>
                      {currentProgram.communityLink && hasActiveAccess ? (
                        <a
                          href={currentProgram.communityLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="my-1 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-white hover:underline"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Join Group</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      ) : (
                        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 my-1">
                          {hasActiveAccess ? "Active" : "Locked"}
                        </p>
                      )}
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Discussion Channel
                      </span>
                    </div>
                  </div>
                </div>

                {/* Day Selector Timeline */}
                <div className="glass-panel p-4 sm:p-5 rounded-3xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      Daily Schedule
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Complete video & checklist by 23:59 daily
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                    {currentProgram.days.map((day, idx) => {
                      const isSelected = activeDayIndex === idx;
                      const isCompleted = !!day.userProgress?.isCompleted;
                      const isSkipped = day.isSkipped && !isCompleted;
                      const isLockedFuture = !day.isCalendarUnlocked;
                      const isToday = day.isCalendarUnlocked && !day.isPast2359;

                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => setActiveDayIndex(idx)}
                          className={`px-4 py-3 rounded-2xl text-left shrink-0 flex items-center gap-3 transition ${
                            isSelected
                              ? "chrome-button shadow-md"
                              : "glass-panel-subtle text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white"
                          }`}
                        >
                          <div>
                            <div className="text-xs font-semibold flex items-center gap-1.5">
                              <span>Day {day.dayNumber}</span>
                              {isToday && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                                    isSelected
                                      ? "bg-white/20 text-white dark:bg-black/15 dark:text-zinc-900"
                                      : "bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-300"
                                  }`}
                                >
                                  Today
                                </span>
                              )}
                            </div>
                            <span className="text-xs opacity-75 block">
                              {formatShortDate(day.unlockDate)}
                            </span>
                          </div>

                          {isCompleted ? (
                            <CheckCircle
                              className={`w-4 h-4 ${
                                isSelected ? "text-current" : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            />
                          ) : isSkipped ? (
                            <span title="Skipped Day (Missed 23:59 cutoff)">
                              <AlertTriangle
                                className={`w-4 h-4 ${
                                  isSelected ? "text-amber-300 dark:text-amber-600" : "text-amber-500"
                                }`}
                              />
                            </span>
                          ) : isLockedFuture ? (
                            <Lock className="w-3.5 h-3.5 opacity-60" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-current opacity-60" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Daily Content Bento Grid */}
                {currentDay && (
                  <div className="space-y-5">
                    {/* Day Title Banner */}
                    <div className="glass-panel rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                            Day {currentDay.dayNumber} • {formatShortDate(currentDay.unlockDate)}
                          </span>
                          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full glass-panel-subtle text-zinc-800 dark:text-zinc-200">
                            {currentDay.dayType === "TRAINING_DAY"
                              ? "Workout Day"
                              : currentDay.dayType === "REST_DAY"
                              ? "Rest Day"
                              : "On-Site Session"}
                          </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                          {currentDay.title}
                        </h2>
                        {currentDay.dayType !== "REST_DAY" && (currentDay.coachName || currentDay.recommendedFor) && (
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                            {currentDay.coachName && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-medium">
                                Coach: {currentDay.coachName}
                              </span>
                            )}
                            {currentDay.recommendedFor && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-900/5 dark:bg-white/10 text-zinc-600 dark:text-zinc-300">
                                Target: {currentDay.recommendedFor}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {currentDay.userProgress?.isCompleted ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/20 px-3.5 py-1.5 rounded-full">
                            <CheckCircle className="w-4 h-4" /> Completed
                          </span>
                        ) : currentDay.isSkipped ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/20 px-3.5 py-1.5 rounded-full">
                            <AlertTriangle className="w-4 h-4" /> Skipped Day
                          </span>
                        ) : !currentDay.isCalendarUnlocked ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 glass-panel-subtle px-3.5 py-1.5 rounded-full">
                            <Lock className="w-3.5 h-3.5" /> Unlocks {formatShortDate(currentDay.unlockDate)} at 00:00
                          </span>
                        ) : null}

                        {hasActiveAccess &&
                          currentDay.isCalendarUnlocked &&
                          !currentDay.isPast2359 && (
                            <button
                              type="button"
                              onClick={handleToggleCompleteDay}
                              disabled={isSavingProgress}
                              className={`px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
                                currentDay.userProgress?.isCompleted
                                  ? "glass-panel-subtle text-zinc-800 dark:text-zinc-200"
                                  : "chrome-button"
                              }`}
                            >
                              {isSavingProgress ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : currentDay.userProgress?.isCompleted ? (
                                <>Reopen Day</>
                              ) : (
                                <>
                                  Complete Day <CheckCircle className="w-3.5 h-3.5" />
                                </>
                              )}
                            </button>
                          )}
                      </div>
                    </div>

                    {/* GATE 1: Unpaid User */}
                    {!hasActiveAccess ? (
                      <div className="glass-panel rounded-3xl p-10 text-center space-y-4">
                        <Lock className="w-6 h-6 text-zinc-500 mx-auto" />
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                          Members-Only Content
                        </h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                          Enroll in this program to unlock daily workout videos, meal recommendations, and self-assessment checklists.
                        </p>
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => handleOpenQrisCheckout(currentProgram.id)}
                            disabled={enrollingId === currentProgram.id}
                            className="px-6 py-3 rounded-xl chrome-button text-xs font-medium inline-flex items-center gap-2"
                          >
                            <QrCode className="w-4 h-4" /> Enroll Now (Rp{" "}
                            {currentProgram.price.toLocaleString("id-ID")})
                          </button>
                        </div>
                      </div>
                    ) : !currentDay.isCalendarUnlocked ? (
                      /* GATE 2: Future Calendar Day */
                      <div className="glass-panel rounded-3xl p-10 text-center space-y-3">
                        <Clock className="w-6 h-6 text-zinc-500 mx-auto" />
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                          Scheduled for {formatShortDate(currentDay.unlockDate)}
                        </h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                          Day {currentDay.dayNumber} will unlock automatically at{" "}
                          <strong className="text-zinc-900 dark:text-white">
                            00:00 on {formatShortDate(currentDay.unlockDate)}
                          </strong>{" "}
                          according to your batch schedule.
                        </p>
                      </div>
                    ) : (
                      /* UNLOCKED 12-COLUMN BENTO CURRICULUM GRID */
                      <div className="grid lg:grid-cols-12 gap-5 items-start">
                        {/* Left Column (7 Columns): Video / Rest / On-Site Visual Card */}
                        <div className="lg:col-span-7 space-y-5">
                          {currentDay.dayType === "TRAINING_DAY" && (
                            <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                  <Video className="w-4 h-4" /> Step 1: Workout Video
                                </span>
                                <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                  <ShieldCheck className="w-3.5 h-3.5" /> Protected Stream
                                </span>
                              </div>

                              <div
                                onContextMenu={(e) => e.preventDefault()}
                                className="rounded-2xl overflow-hidden aspect-video relative border border-zinc-200 dark:border-white/10 flex items-center justify-center bg-zinc-900 select-none"
                              >
                                {(() => {
                                  const embed = normalizeVideoEmbed(currentDay.videoUrl);
                                  if (embed.embedUrl) {
                                    if (embed.provider === "DIRECT") {
                                      return (
                                        <video
                                          src={embed.embedUrl}
                                          controls
                                          playsInline
                                          controlsList="nodownload"
                                          className="w-full h-full object-contain bg-black"
                                        />
                                      );
                                    }
                                    return (
                                      <iframe
                                        src={embed.embedUrl}
                                        title={currentDay.title}
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                      />
                                    );
                                  }
                                  return (
                                    <div className="relative w-full h-full flex items-center justify-center group">
                                      <Image
                                        src="/image.jpg"
                                        alt="Video cover"
                                        fill
                                        className="object-cover scale-110 blur-[2px] group-hover:blur-0 transition-all duration-700"
                                      />
                                      <div className="absolute inset-0 bg-black/45" />
                                      <div className="relative z-10 text-center space-y-1 p-4 rounded-2xl glass-image-overlay">
                                        <Play className="w-7 h-7 text-white mx-auto" />
                                        <p className="text-xs text-white font-medium">
                                          Protected Workout Stream
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                                  Mark video as watched after finishing your session
                                </span>
                                <button
                                  type="button"
                                  onClick={handleToggleVideoWatched}
                                  className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition ${
                                    getVideoWatched(currentDay)
                                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                                      : "glass-panel-subtle text-zinc-900 dark:text-zinc-100"
                                  }`}
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  {getVideoWatched(currentDay)
                                    ? "Video Watched"
                                    : "Mark Video Watched"}
                                </button>
                              </div>
                            </div>
                          )}

                          {currentDay.dayType === "REST_DAY" && (
                            <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-5 group">
                              <div className="relative h-56 w-full rounded-2xl overflow-hidden bg-zinc-900">
                                <Image
                                  src="/image.jpg"
                                  alt="Rest Day"
                                  fill
                                  className="object-cover scale-125 blur-[2.5px] group-hover:blur-0 group-hover:scale-110 transition-all duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl glass-image-overlay">
                                  <span className="text-xs text-zinc-300 block">
                                    Scheduled Recovery
                                  </span>
                                  <h3 className="text-base font-semibold text-white">
                                    Active Rest & Mobility Protocol
                                  </h3>
                                </div>
                              </div>
                              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                                {currentDay.restInstructions ||
                                  "Take a light 25-minute walk, focus on gentle stretching, and stay hydrated throughout the day."}
                              </p>
                            </div>
                          )}

                          {currentDay.dayType === "MEETUP_DAY" && (
                            <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-5 group">
                              <div className="relative h-52 w-full rounded-2xl overflow-hidden bg-zinc-900">
                                <Image
                                  src="/image.jpg"
                                  alt="On-Site Session"
                                  fill
                                  className="object-cover object-right scale-125 blur-[2px] group-hover:blur-0 group-hover:scale-110 transition-all duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl glass-image-overlay">
                                  <span className="text-xs text-zinc-300 block">
                                    On-Site Community Session
                                  </span>
                                  <h3 className="text-base font-semibold text-white">
                                    {currentDay.title}
                                  </h3>
                                </div>
                              </div>

                              <div className="grid sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl glass-panel-subtle space-y-1">
                                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-orange-500" /> Venue Location
                                  </span>
                                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                                    {currentDay.onsiteVenue ||
                                      currentProgram.venueAddress ||
                                      "The Sanctuary Wellness Studio, Senopati, Jakarta"}
                                  </p>
                                </div>

                                <div className="p-4 rounded-2xl glass-panel-subtle space-y-1">
                                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-orange-500" /> Session Time
                                  </span>
                                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                                    {currentDay.onsiteSchedule || "08:30 – 10:00 WIB"}
                                  </p>
                                </div>
                              </div>

                              {currentDay.meetupLink && (
                                <div className="p-4 sm:p-5 rounded-2xl bg-orange-500/10 border border-orange-500/25 space-y-2.5">
                                  <div className="flex items-center gap-2 text-xs font-semibold text-orange-600 dark:text-orange-400">
                                    <Video className="w-4 h-4" />
                                    <span>Live Stream Video Conference (Peserta Luar Kota)</span>
                                  </div>
                                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                    Bagi peserta yang berdomisili di luar kota atau berhalangan hadir fisik ke studio, Anda dapat mengikuti sesi ini secara interaktif via streaming langsung:
                                  </p>
                                  <a
                                    href={currentDay.meetupLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl chrome-button text-xs font-semibold shadow-sm"
                                  >
                                    <span>Gabung Live Streaming</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Daily Self-Assessment Note Card */}
                          {currentDay.dailyAssessment && (
                            <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-3">
                              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block">
                                Daily Self-Assessment
                              </span>
                              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                                {currentDay.dailyAssessment}
                              </p>
                              <textarea
                                rows={2}
                                disabled={currentDay.isPast2359}
                                value={
                                  dayAssessments[currentDay.id] !== undefined
                                    ? dayAssessments[currentDay.id]
                                    : currentDay.userProgress?.assessmentResponse || ""
                                }
                                onChange={(e) =>
                                  setDayAssessments((prev) => ({
                                    ...prev,
                                    [currentDay.id]: e.target.value,
                                  }))
                                }
                                placeholder={
                                  currentDay.isPast2359
                                    ? "Catatan harian telah menjadi arsip baca-saja."
                                    : "Enter your notes"
                                }
                                className={`w-full p-3.5 text-sm rounded-xl glass-input ${
                                  currentDay.isPast2359 ? "opacity-60 cursor-not-allowed" : ""
                                }`}
                              />
                              <div className="flex items-center justify-between pt-1">
                                {currentDay.isPast2359 ? (
                                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 italic">
                                    Catatan terkunci (batas cutoff 23:59 telah lewat)
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                    Simpan refleksi harian Anda sebelum 23:59 WIB
                                  </span>
                                )}
                                {!currentDay.isPast2359 && (
                                  <button
                                    type="button"
                                    onClick={handleSaveAssessment}
                                    disabled={isSavingProgress}
                                    className="px-4 py-2 rounded-xl chrome-button text-xs font-medium"
                                  >
                                    Save Note
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right Column (5 Columns): Checklist & Motion-Blur Meal Card */}
                        <div className="lg:col-span-5 space-y-5">
                          {/* Daily Checklist */}
                          {currentDay.dayType === "TRAINING_DAY" &&
                            currentDay.videoChecklist &&
                            currentDay.videoChecklist.length > 0 && (
                              <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                    <CheckSquare className="w-4 h-4" /> Step 2: Daily Checklist
                                  </span>
                                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                    {getCheckedItems(currentDay).length} /{" "}
                                    {currentDay.videoChecklist.length} Done
                                  </span>
                                </div>
                                <div className="space-y-2.5">
                                  {currentDay.videoChecklist.map((task, idx) => {
                                    const checked = getCheckedItems(currentDay).includes(task);
                                    return (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleToggleChecklist(task)}
                                        className={`w-full text-left p-3.5 rounded-2xl border text-sm transition flex items-center gap-3 ${
                                          checked
                                            ? "glass-panel-subtle border-zinc-300 dark:border-white/20 text-zinc-500 dark:text-zinc-400"
                                            : "glass-panel-subtle border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-zinc-100"
                                        }`}
                                      >
                                        {checked ? (
                                          <CheckSquare className="w-4 h-4 text-zinc-900 dark:text-white shrink-0" />
                                        ) : (
                                          <Square className="w-4 h-4 text-zinc-400 shrink-0" />
                                        )}
                                        <span className={checked ? "line-through" : ""}>
                                          {task}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                          {/* Meal Recommendation Bento Card with Motion-Blur Image Header */}
                          {currentDay.mealRecommendation && (
                            <div className="glass-panel rounded-3xl p-4 sm:p-5 space-y-4 group">
                              <div className="relative h-36 w-full rounded-2xl overflow-hidden bg-zinc-900">
                                <Image
                                  src="/image.jpg"
                                  alt="Meal Guide"
                                  fill
                                  className="object-cover object-bottom scale-125 blur-[2px] group-hover:blur-0 group-hover:scale-110 transition-all duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                                <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl glass-image-overlay flex items-center gap-2 text-white">
                                  <Utensils className="w-4 h-4 shrink-0" />
                                  <span className="text-xs font-semibold">
                                    Daily Meal Recommendation
                                  </span>
                                </div>
                              </div>

                              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line px-1">
                                {currentDay.mealRecommendation}
                              </p>
                            </div>
                          )}

                          {/* Daily Reminder Card */}
                          {(currentDay.userProgress?.isCompleted
                            ? currentDay.completedReminder
                            : currentDay.pendingReminder) && (
                            <div className="glass-panel rounded-3xl p-5 space-y-2">
                              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                <Bell className="w-4 h-4 text-zinc-500" /> Daily Note
                              </span>
                              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                {currentDay.userProgress?.isCompleted
                                  ? currentDay.completedReminder
                                  : currentDay.pendingReminder}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: ALL PLANS (IMAGE AS FULL BACKGROUND WIDGET)                   */}
        {/* ===================================================================== */}
        {activeTab === "all_plan" && (
          <div className="space-y-6">
            <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400 block">
                Curated Cohorts
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                All Plans
              </h1>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-xl">
                Choose your structured longevity and movement protocol. Strictly capped at 35 members per cohort to preserve intimate coach attention.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {allPrograms.map((prog, idx) => {
                const enrolled = myPrograms.find((e) => e.programId === prog.id);
                const isActive = enrolled?.status === "ACTIVE";
                const remainingSlots = Math.max(0, prog.maxQuota - prog.enrolledCount);

                return (
                  <div
                    key={prog.id}
                    className="relative rounded-3xl overflow-hidden glass-panel border border-white/60 dark:border-white/10 min-h-[420px] p-6 sm:p-7 flex flex-col justify-between group shadow-xl"
                  >
                    {/* Full Background Image */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <Image
                        src={idx % 2 === 0 ? "/test.jpg" : "/pic.jpg"}
                        alt={prog.title}
                        fill
                        className="object-cover object-center scale-105 group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                    {/* Luminous light scrim */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20 pointer-events-none" />

                    {/* Top Badges */}
                    <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-3 py-1 rounded-full glass-image-overlay text-[10px] font-semibold uppercase tracking-wider text-white">
                          {prog.dayCount} Days
                        </span>

                        {prog.locationType === "ONSITE" && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/25 border border-amber-400/40 text-[10px] font-semibold text-amber-200 backdrop-blur-md flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-300" />
                            <span>On-Site • {prog.city || "Studio"}</span>
                          </span>
                        )}

                        {prog.locationType === "HYBRID" && (
                          <span className="px-2.5 py-1 rounded-full bg-purple-500/25 border border-purple-400/40 text-[10px] font-semibold text-purple-200 backdrop-blur-md flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-purple-300" />
                            <span>Hybrid • {prog.city || "Studio"}</span>
                          </span>
                        )}

                        {(!prog.locationType || prog.locationType === "ONLINE") && (
                          <span className="px-2.5 py-1 rounded-full bg-blue-500/25 border border-blue-400/40 text-[10px] font-semibold text-blue-200 backdrop-blur-md">
                            🌐 100% Online
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isActive ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md">
                            Active Plan
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full glass-image-overlay text-[11px] font-medium text-white flex items-center gap-1.5">
                            <Users className="w-3 h-3 text-orange-400" />
                            <span>{remainingSlots} spots left</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Floating Glassmorphic Content Card */}
                    <div className="relative z-10 glass-image-overlay rounded-2xl p-5 space-y-3.5 text-white border border-white/20 backdrop-blur-xl">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[11px] text-zinc-300">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-orange-400" /> {prog.coachName}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-orange-400" /> Starts {formatShortDate(prog.startDate)}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold tracking-tight text-white">
                          {prog.title}
                        </h3>

                        <p className="text-xs text-zinc-200/90 line-clamp-2 leading-relaxed">
                          {prog.description}
                        </p>

                        {prog.locationType !== "ONLINE" && prog.virtualFallbackAvailable && (
                          <div className="pt-1 flex items-center gap-1.5 text-[11px] text-orange-200/90">
                            <Video className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                            <span>Peserta luar kota: Live streaming Zoom tersedia</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-white/15 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">
                            Tuition
                          </span>
                          <span className="text-base font-bold text-white">
                            Rp {prog.price.toLocaleString("id-ID")}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailedProgram(prog)}
                            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-medium transition"
                            title="View Overview"
                          >
                            <Info className="w-4 h-4" />
                          </button>

                          {isActive ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProgId(prog.id);
                                setActiveDayIndex(0);
                                setActiveTab("my_plan");
                              }}
                              className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-semibold inline-flex items-center gap-1.5 transition shadow"
                            >
                              <span>Open My Plan</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenQrisCheckout(prog.id)}
                              disabled={enrollingId === prog.id}
                              className="px-4 py-2 rounded-xl chrome-button text-xs font-semibold inline-flex items-center gap-1.5 transition shadow"
                            >
                              {enrollingId === prog.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : enrolled ? (
                                <>
                                  <QrCode className="w-3.5 h-3.5" />
                                  <span>Complete Payment</span>
                                </>
                              ) : (
                                <>
                                  <QrCode className="w-3.5 h-3.5" />
                                  <span>Join Cohort</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 3: SETTING (PROFILE, REMINDERS, SECURITY, PREFERENCES)             */}
        {/* ===================================================================== */}
        {activeTab === "setting" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400 block">
                Preferences & Credentials
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Settings
              </h1>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                Manage your personal profile, notification schedule, credentials, and app preferences.
              </p>
            </div>

            {/* 1. Profile Information */}
            <form
              onSubmit={handleUpdateProfile}
              className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm"
            >
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Profile Information
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Update your contact details and display name.
                </p>
              </div>

              {profileMsg && (
                <div
                  className={`p-3.5 rounded-xl text-xs ${
                    profileMsg.type === "success"
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                      : "bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300"
                  }`}
                >
                  {profileMsg.text}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={profileForm.fullName}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, fullName: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full px-4 py-2.5 rounded-xl glass-panel-subtle text-sm text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    WhatsApp / Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +62 812..."
                    value={profileForm.phone}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 text-right">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="px-5 py-2.5 rounded-xl chrome-button text-xs font-semibold"
                >
                  {isUpdatingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>

            {/* 2. Daily Reminders & Alerts */}
            <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-orange-500" />
                    <span>Daily Reminder Schedule</span>
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Set notifications for your morning session and evening 23:59 checklist cutoff.
                  </p>
                </div>
                <span className="text-xs font-medium px-3 py-1 rounded-full glass-panel-subtle shrink-0 text-zinc-800 dark:text-zinc-200">
                  {notifPermission === "granted" ? "Enabled" : "Not Enabled"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Morning Routine
                  </label>
                  <input
                    type="time"
                    value={morningTime}
                    onChange={(e) => setMorningTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Evening Cutoff (23:59)
                  </label>
                  <input
                    type="time"
                    value={eveningTime}
                    onChange={(e) => setEveningTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleEnableNotifications}
                  className="px-5 py-2.5 rounded-xl chrome-button text-xs font-semibold"
                >
                  {notifPermission === "granted"
                    ? "Save Schedule"
                    : "Enable Notifications"}
                </button>
                <button
                  type="button"
                  onClick={() => handleTestReminder("morning")}
                  className="px-4 py-2.5 rounded-xl glass-panel-subtle text-xs font-medium text-zinc-900 dark:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/5 transition"
                >
                  Test Morning Alert
                </button>
                <button
                  type="button"
                  onClick={() => handleTestReminder("evening")}
                  className="px-4 py-2.5 rounded-xl glass-panel-subtle text-xs font-medium text-zinc-900 dark:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/5 transition"
                >
                  Test Evening Alert
                </button>
              </div>

              {/* PWA Home Screen Guide */}
              <div className="pt-4 border-t border-zinc-900/[0.06] dark:border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-white">
                  <Smartphone className="w-4 h-4 text-orange-500" />
                  <span>Install on Home Screen (PWA)</span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  For the best experience, add this app to your mobile home screen via browser menu:
                </p>
                <ol className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400 list-decimal list-inside">
                  <li>In <strong>Safari (iOS)</strong>, tap Share &rarr; &ldquo;Add to Home Screen&rdquo;.</li>
                  <li>In <strong>Chrome (Android)</strong>, tap Menu (3 dots) &rarr; &ldquo;Install app&rdquo;.</li>
                </ol>
              </div>
            </div>

            {/* 3. Security & Password */}
            <form
              onSubmit={handleChangePassword}
              className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm"
            >
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Change Password
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Ensure your account is using a strong password.
                </p>
              </div>

              {passwordMsg && (
                <div
                  className={`p-3.5 rounded-xl text-xs ${
                    passwordMsg.type === "success"
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                      : "bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300"
                  }`}
                >
                  {passwordMsg.text}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={peekCurrentPass ? "text" : "password"}
                      required
                      placeholder="Enter current password"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))
                      }
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl glass-input text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setPeekCurrentPass(!peekCurrentPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    >
                      {peekCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={peekNewPass ? "text" : "password"}
                      required
                      minLength={8}
                      placeholder="Enter new password (min. 8 characters)"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))
                      }
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl glass-input text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setPeekNewPass(!peekNewPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    >
                      {peekNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={peekConfirmPass ? "text" : "password"}
                      required
                      minLength={8}
                      placeholder="Confirm new password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))
                      }
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl glass-input text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setPeekConfirmPass(!peekConfirmPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    >
                      {peekConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-right">
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="px-5 py-2.5 rounded-xl chrome-button text-xs font-semibold"
                >
                  {isChangingPass ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>

            {/* 4. Danger Zone */}
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-red-500/20 space-y-3 shadow-sm">
              <h3 className="text-base font-bold text-red-600 dark:text-red-400">
                Delete Account
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Permanently delete your account, curriculum progress, and active cohort enrollments. This action cannot be undone.
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(true)}
                  className="px-4 py-2 rounded-xl glass-panel-subtle text-red-600 dark:text-red-400 hover:border-red-500/40 text-xs font-semibold transition"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Delete Account Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 space-y-4">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              Delete Your Account
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Please enter your password to confirm permanent account deletion.
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 text-xs">
                {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div className="relative">
                <input
                  type={peekDeletePass ? "text" : "password"}
                  required
                  placeholder="Enter your password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl glass-input text-sm"
                />
                <button
                  type="button"
                  onClick={() => setPeekDeletePass(!peekDeletePass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                >
                  {peekDeletePass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setDeletePassword("");
                    setDeleteError(null);
                  }}
                  className="px-4 py-2 rounded-xl glass-panel-subtle text-zinc-800 dark:text-zinc-200 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeletingAccount}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition"
                >
                  {isDeletingAccount ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <QrisCheckoutModal
        isOpen={!!qrisInvoice}
        invoice={qrisInvoice}
        onClose={() => setQrisInvoice(null)}
        onSuccess={(progId) => {
          setQrisInvoice(null);
          setSelectedProgId(progId);
          setActiveTab("my_plan");
          router.refresh();
        }}
        programLocationType={
          allPrograms.find((p) => p.id === qrisInvoice?.programId)?.locationType
        }
        programVenue={
          allPrograms.find((p) => p.id === qrisInvoice?.programId)?.venueAddress
        }
      />

      {/* Program Detail Explanation Modal */}
      {detailedProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/55 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200 text-xs">
          <div className="w-full max-w-xl glass-panel rounded-3xl flex flex-col max-h-[90vh] overflow-hidden shadow-2xl border border-white/70 dark:border-white/10">
            {/* Modal Header with Full Background Image Header */}
            <div className="relative h-44 w-full bg-zinc-900 overflow-hidden shrink-0">
              <Image
                src="/image.jpg"
                alt={detailedProgram.title}
                fill
                className="object-cover scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

              <button
                type="button"
                onClick={() => setDetailedProgram(null)}
                className="absolute top-4 right-4 p-2 rounded-full glass-image-overlay text-white hover:bg-white/20 transition z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-4 left-5 right-5 text-white space-y-1">
                <span className="px-2.5 py-0.5 rounded-full glass-image-overlay text-[10px] font-semibold uppercase tracking-wider">
                  {detailedProgram.dayCount} Days Cohort
                </span>
                <h3 className="text-lg font-bold tracking-tight">
                  {detailedProgram.title}
                </h3>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400 block">
                  About This Cohort
                </span>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {detailedProgram.description}
                </p>
                {detailedProgram.recommendedFor && (
                  <div className="p-3 rounded-2xl glass-panel-subtle text-xs">
                    <span className="font-semibold text-zinc-900 dark:text-white block mb-0.5">
                      Recommended For:
                    </span>
                    <span className="text-zinc-600 dark:text-zinc-300">
                      {detailedProgram.recommendedFor}
                    </span>
                  </div>
                )}
              </div>

              {/* Program Schedule Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl glass-panel-subtle space-y-0.5">
                  <span className="text-zinc-500 dark:text-zinc-400 block text-[11px]">
                    Lead Coach
                  </span>
                  <strong className="font-semibold text-zinc-900 dark:text-white">
                    {detailedProgram.coachName}
                  </strong>
                </div>

                <div className="p-3.5 rounded-2xl glass-panel-subtle space-y-0.5">
                  <span className="text-zinc-500 dark:text-zinc-400 block text-[11px]">
                    Tuition Fee
                  </span>
                  <strong className="font-semibold text-zinc-900 dark:text-white">
                    Rp {detailedProgram.price.toLocaleString("id-ID")}
                  </strong>
                </div>

                <div className="p-3.5 rounded-2xl glass-panel-subtle space-y-0.5">
                  <span className="text-zinc-500 dark:text-zinc-400 block text-[11px]">
                    Start Date
                  </span>
                  <strong className="font-semibold text-zinc-900 dark:text-white">
                    {new Date(detailedProgram.startDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </strong>
                </div>

                <div className="p-3.5 rounded-2xl glass-panel-subtle space-y-0.5">
                  <span className="text-zinc-500 dark:text-zinc-400 block text-[11px]">
                    Seats Availability
                  </span>
                  <strong className="font-semibold text-zinc-900 dark:text-white">
                    {Math.max(0, detailedProgram.maxQuota - detailedProgram.enrolledCount)} of {detailedProgram.maxQuota} Spots Open
                  </strong>
                </div>
              </div>

              {/* What Happens Daily */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400 block">
                  How The Daily Curriculum Works
                </span>
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 p-3 rounded-2xl glass-panel-subtle text-xs">
                    <Clock className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold text-zinc-900 dark:text-white block">
                        00:00 Morning Session Unlock
                      </strong>
                      <span className="text-zinc-600 dark:text-zinc-400 text-[11px]">
                        New workout video & anti-inflammatory meal guide ready each day.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-2xl glass-panel-subtle text-xs">
                    <CheckCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold text-zinc-900 dark:text-white block">
                        23:59 Daily Streak Cutoff
                      </strong>
                      <span className="text-zinc-600 dark:text-zinc-400 text-[11px]">
                        Mark your video watched and checklist complete before midnight.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-5 border-t border-zinc-900/[0.06] dark:border-white/10 flex items-center justify-between gap-3 bg-white/40 dark:bg-white/[0.02]">
              <button
                type="button"
                onClick={() => setDetailedProgram(null)}
                className="px-4 py-2.5 rounded-xl glass-panel-subtle text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                Close
              </button>

              {(() => {
                const enrolled = myPrograms.find((e) => e.programId === detailedProgram.id);
                const isActive = enrolled?.status === "ACTIVE";

                if (isActive) {
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProgId(detailedProgram.id);
                        setActiveDayIndex(0);
                        setActiveTab("my_plan");
                        setDetailedProgram(null);
                      }}
                      className="px-6 py-2.5 rounded-xl chrome-button text-xs font-semibold flex items-center gap-1.5"
                    >
                      Open Daily Plan <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  );
                }

                return (
                  <button
                    type="button"
                    onClick={() => {
                      const progId = detailedProgram.id;
                      setDetailedProgram(null);
                      handleOpenQrisCheckout(progId);
                    }}
                    className="px-6 py-2.5 rounded-xl chrome-button text-xs font-semibold flex items-center gap-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5" /> Enroll Now (Rp {detailedProgram.price.toLocaleString("id-ID")})
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
