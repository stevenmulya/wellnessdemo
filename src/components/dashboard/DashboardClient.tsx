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
import { SleepTrackerCard } from "./SleepTrackerCard";
import { VideoThumbnailLinkCard } from "./VideoThumbnailLinkCard";
import { WorkoutSection } from "./WorkoutSection";
import { MealSection } from "./MealSection";
import { DailyReflectionCard } from "./DailyReflectionCard";
import {
  CheckCircle,
  CheckCircle2,
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
  workoutOptions?: string[];
  sleepRecommendation?: string | null;
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
  mapLink?: string | null;
  onsiteVenue: string | null;
  onsiteSchedule: string | null;
  eventTitle?: string | null;
  eventHost?: string | null;
  eventDetails?: string | null;
  restInstructions: string | null;
  coachName?: string | null;
  recommendedFor?: string | null;
  dayNotifications?: Array<{ time: string; message: string; label?: string }>;
  userProgress?: {
    id: string;
    videoWatched: boolean;
    isCompleted: boolean;
    checklistCompleted: string | null;
    selectedWorkout?: string | null;
    photoBeforeUrl?: string | null;
    photoAfterUrl?: string | null;
    workoutNotes?: string | null;
    eventFeedback?: string | null;
    mealCompliance?: string | null;
    mealNotes?: string | null;
    dailyReflection?: string | null;
    happinessRate?: number | null;
    bedtime?: string | null;
    wakeTime?: string | null;
    sleepDurationMinutes?: number | null;
    assessmentResponse?: string | null;
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
  registrationOpenDate?: Date | string | null;
  registrationDeadline: Date | string;
  status?: string;
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
  const [dayWorkouts, setDayWorkouts] = useState<Record<string, string>>({});
  const [dayPhotosBefore, setDayPhotosBefore] = useState<Record<string, string>>({});
  const [dayPhotosAfter, setDayPhotosAfter] = useState<Record<string, string>>({});
  const [dayMealCompliance, setDayMealCompliance] = useState<Record<string, string>>({});
  const [dayMealNotes, setDayMealNotes] = useState<Record<string, string>>({});
  const [dayWorkoutNotes, setDayWorkoutNotes] = useState<Record<string, string>>({});
  const [dayEventFeedback, setDayEventFeedback] = useState<Record<string, string>>({});
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const [dayReflections, setDayReflections] = useState<Record<string, string>>({});
  const [dayHappiness, setDayHappiness] = useState<Record<string, number>>({});
  const [dayBedtimes, setDayBedtimes] = useState<Record<string, string>>({});
  const [dayWakeTimes, setDayWakeTimes] = useState<Record<string, string>>({});
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
      isCompleted: autoComplete,
      selectedWorkout: dayWorkouts[currentDay.id] || currentDay.userProgress?.selectedWorkout || undefined,
      photoBeforeUrl: dayPhotosBefore[currentDay.id] || currentDay.userProgress?.photoBeforeUrl || undefined,
      photoAfterUrl: dayPhotosAfter[currentDay.id] || currentDay.userProgress?.photoAfterUrl || undefined,
      mealCompliance: dayMealCompliance[currentDay.id] || currentDay.userProgress?.mealCompliance || undefined,
      mealNotes: dayMealNotes[currentDay.id] !== undefined ? dayMealNotes[currentDay.id] : currentDay.userProgress?.mealNotes || undefined,
      dailyReflection: dayReflections[currentDay.id] !== undefined ? dayReflections[currentDay.id] : currentDay.userProgress?.dailyReflection || undefined,
      happinessRate: dayHappiness[currentDay.id] || currentDay.userProgress?.happinessRate || undefined,
      bedtime: dayBedtimes[currentDay.id] || currentDay.userProgress?.bedtime || undefined,
      wakeTime: dayWakeTimes[currentDay.id] || currentDay.userProgress?.wakeTime || undefined,
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
        text: `Day ${currentDay.dayNumber} checklist completed.`,
      });
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  const handleSaveSleep = async (
    bedtime: string,
    wakeTime: string,
    sleepDurationMinutes: number
  ) => {
    if (!currentDay) return;
    setDayBedtimes((prev) => ({ ...prev, [currentDay.id]: bedtime }));
    setDayWakeTimes((prev) => ({ ...prev, [currentDay.id]: wakeTime }));

    const res = await wellnessUserSubmitDayProgress({
      programDayId: currentDay.id,
      isCompleted: !!currentDay.userProgress?.isCompleted,
      checklistCompleted: getCheckedItems(currentDay),
      videoWatched: getVideoWatched(currentDay),
      bedtime,
      wakeTime,
      sleepDurationMinutes,
    });

    if (!res.success) {
      setActionNotice({ type: "error", text: res.message || "Failed to save sleep log." });
      setTimeout(() => setActionNotice(null), 4000);
    } else {
      setActionNotice({ type: "success", text: "Sleep log saved successfully." });
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const handleSelectWorkout = async (workout: string) => {
    if (!currentDay) return;
    setDayWorkouts((prev) => ({ ...prev, [currentDay.id]: workout }));

    const res = await wellnessUserSubmitDayProgress({
      programDayId: currentDay.id,
      isCompleted: !!currentDay.userProgress?.isCompleted,
      checklistCompleted: getCheckedItems(currentDay),
      videoWatched: getVideoWatched(currentDay),
      selectedWorkout: workout,
    });

    if (!res.success) {
      setActionNotice({ type: "error", text: res.message || "Failed to select workout discipline." });
      setTimeout(() => setActionNotice(null), 4000);
    } else {
      setActionNotice({ type: "success", text: `Workout selected: ${workout}` });
      setTimeout(() => setActionNotice(null), 2500);
    }
  };

  const handleUploadPhoto = async (type: "before" | "after", base64OrUrl: string) => {
    if (!currentDay) return;
    if (type === "before") {
      setDayPhotosBefore((prev) => ({ ...prev, [currentDay.id]: base64OrUrl }));
    } else {
      setDayPhotosAfter((prev) => ({ ...prev, [currentDay.id]: base64OrUrl }));
    }

    const res = await wellnessUserSubmitDayProgress({
      programDayId: currentDay.id,
      isCompleted: !!currentDay.userProgress?.isCompleted,
      checklistCompleted: getCheckedItems(currentDay),
      videoWatched: getVideoWatched(currentDay),
      photoBeforeUrl: type === "before" ? base64OrUrl : undefined,
      photoAfterUrl: type === "after" ? base64OrUrl : undefined,
    });

    if (!res.success) {
      setActionNotice({ type: "error", text: res.message || "Failed to upload progress photo." });
      setTimeout(() => setActionNotice(null), 4000);
    } else {
      setActionNotice({
        type: "success",
        text: type === "before" ? "Before photo uploaded successfully." : "After photo uploaded successfully.",
      });
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const handleSaveWorkoutNotes = async (notes: string) => {
    if (!currentDay) return;
    setDayWorkoutNotes((prev) => ({ ...prev, [currentDay.id]: notes }));

    const res = await wellnessUserSubmitDayProgress({
      programDayId: currentDay.id,
      isCompleted: !!currentDay.userProgress?.isCompleted,
      checklistCompleted: getCheckedItems(currentDay),
      videoWatched: getVideoWatched(currentDay),
      workoutNotes: notes,
    });

    if (!res.success) {
      setActionNotice({ type: "error", text: res.message || "Failed to save workout notes." });
      setTimeout(() => setActionNotice(null), 4000);
    } else {
      setActionNotice({ type: "success", text: "Training notes saved successfully." });
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const handleUpdateChecklistRep = async (task: string, repVal: string) => {
    if (!currentDay) return;
    const taskName = task.includes("=") ? task.split("=")[0].trim() : task.trim();
    const currentList = getCheckedItems(currentDay);

    const filtered = currentList.filter((item) => {
      const iName = item.includes("=") ? item.split("=")[0].trim() : item.trim();
      return iName.toLowerCase() !== taskName.toLowerCase() && item !== task;
    });

    const formattedItem = repVal.trim() ? `${taskName} = ${repVal.trim()}` : task;
    const nextList = [...filtered, formattedItem];
    setDayChecklists((prev) => ({ ...prev, [currentDay.id]: nextList }));

    await wellnessUserSubmitDayProgress({
      programDayId: currentDay.id,
      isCompleted: !!currentDay.userProgress?.isCompleted,
      checklistCompleted: nextList,
      videoWatched: getVideoWatched(currentDay),
    });
  };

  const handleSaveEventFeedback = async (feedbackText: string) => {
    if (!currentDay) return;
    setIsSavingFeedback(true);
    setFeedbackSaved(false);
    try {
      setDayEventFeedback((prev) => ({ ...prev, [currentDay.id]: feedbackText }));

      const res = await wellnessUserSubmitDayProgress({
        programDayId: currentDay.id,
        isCompleted: !!currentDay.userProgress?.isCompleted,
        checklistCompleted: getCheckedItems(currentDay),
        videoWatched: getVideoWatched(currentDay),
        eventFeedback: feedbackText,
      });

      if (!res.success) {
        setActionNotice({ type: "error", text: res.message || "Failed to save event feedback." });
        setTimeout(() => setActionNotice(null), 4000);
      } else {
        setFeedbackSaved(true);
        setActionNotice({ type: "success", text: "Event feedback saved successfully." });
        setTimeout(() => {
          setFeedbackSaved(false);
          setActionNotice(null);
        }, 3000);
      }
    } finally {
      setIsSavingFeedback(false);
    }
  };

  const handleSaveMeal = async (compliance: string, notes: string) => {
    if (!currentDay) return;
    setDayMealCompliance((prev) => ({ ...prev, [currentDay.id]: compliance }));
    setDayMealNotes((prev) => ({ ...prev, [currentDay.id]: notes }));

    const res = await wellnessUserSubmitDayProgress({
      programDayId: currentDay.id,
      isCompleted: !!currentDay.userProgress?.isCompleted,
      checklistCompleted: getCheckedItems(currentDay),
      videoWatched: getVideoWatched(currentDay),
      mealCompliance: compliance,
      mealNotes: notes,
    });

    if (!res.success) {
      setActionNotice({ type: "error", text: res.message || "Failed to save nutrition notes." });
      setTimeout(() => setActionNotice(null), 4000);
    } else {
      setActionNotice({ type: "success", text: "Nutrition notes saved successfully." });
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const handleSaveReflection = async (reflection: string, happinessRate: number) => {
    if (!currentDay) return;
    setDayReflections((prev) => ({ ...prev, [currentDay.id]: reflection }));
    setDayHappiness((prev) => ({ ...prev, [currentDay.id]: happinessRate }));

    const res = await wellnessUserSubmitDayProgress({
      programDayId: currentDay.id,
      isCompleted: !!currentDay.userProgress?.isCompleted,
      checklistCompleted: getCheckedItems(currentDay),
      videoWatched: getVideoWatched(currentDay),
      dailyReflection: reflection,
      happinessRate,
    });

    if (!res.success) {
      setActionNotice({ type: "error", text: res.message || "Failed to save Dear Diary reflection." });
      setTimeout(() => setActionNotice(null), 4000);
    } else {
      setActionNotice({ type: "success", text: "Dear Diary & Daily Fulfillment saved." });
      setTimeout(() => setActionNotice(null), 3000);
    }
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
    const targetProg = allPrograms.find((p) => p.id === programId);
    if (targetProg && targetProg.status === "COMING_SOON") {
      setActionNotice({
        type: "error",
        text: "This program is Coming Soon. Registration will open shortly. Please join the Waitlist.",
      });
      setTimeout(() => setActionNotice(null), 4000);
      return;
    }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="min-h-screen text-zinc-900 dark:text-zinc-100 flex flex-col relative overflow-x-hidden silver-mint-canvas font-mono">
      {/* Top Floating Glassmorphic Navigation Dock */}
      <header
        style={{ top: "max(1.25rem, env(safe-area-inset-top))" }}
        className="fixed left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-5xl h-14 px-5 sm:px-6 rounded-full blur-dock flex items-center justify-between border border-zinc-200/70 dark:border-white/15 shadow-xl transition-all duration-300 font-mono"
      >
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <span className="w-2 h-2 rounded-full bg-gradient-to-tr from-zinc-300 via-white to-zinc-500 shadow-sm border border-white/60 group-hover:scale-125 transition-transform" />
          <span className="font-extralight text-xs uppercase tracking-[0.34em] text-zinc-900 dark:text-white font-geometric">
            BMS
          </span>
        </Link>

        {/* Desktop Navigation (3 Menus: My Ritual, Cohorts, Settings) */}
        <nav className="hidden sm:flex items-center gap-1.5 shrink-0 text-xs font-mono font-medium">
          <button
            onClick={() => setActiveTab("my_plan")}
            className={`px-4 py-1.5 rounded-full text-xs transition duration-200 flex items-center gap-2 ${
              activeTab === "my_plan"
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>My Ritual</span>
          </button>
          <button
            onClick={() => setActiveTab("all_plan")}
            className={`px-4 py-1.5 rounded-full text-xs transition duration-200 flex items-center gap-2 ${
              activeTab === "all_plan"
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Cohorts</span>
          </button>
          <button
            onClick={() => setActiveTab("setting")}
            className={`px-4 py-1.5 rounded-full text-xs transition duration-200 flex items-center gap-2 ${
              activeTab === "setting"
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </nav>

        <div className="flex items-center gap-2.5 shrink-0">
          <ThemeToggle />

          {user.role === "SUPERADMIN" && (
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-full glass-panel-subtle text-[11px] font-medium text-zinc-900 dark:text-zinc-100 hover:bg-white/60 dark:hover:bg-white/10 transition inline-flex items-center gap-1.5 font-mono"
              title="Admin Console"
            >
              <Shield className="w-3 h-3 text-zinc-300" />
              <span className="hidden md:inline">Admin</span>
            </Link>
          )}

          <button
            onClick={handleSignOut}
            title="Sign Out"
            className="p-2 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Mobile-First Bottom Floating Dock (sm:hidden) */}
      <nav
        style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
        className="fixed left-1/2 -translate-x-1/2 z-50 sm:hidden w-[90%] max-w-sm h-14 rounded-full blur-dock px-3 flex items-center justify-around border border-zinc-200/70 dark:border-white/15 shadow-2xl"
      >
        <button
          type="button"
          onClick={() => setActiveTab("my_plan")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5 ${
            activeTab === "my_plan"
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-sm"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-[11px]">Ritual</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("all_plan")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5 ${
            activeTab === "all_plan"
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-sm"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span className="text-[11px]">Cohorts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("setting")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5 ${
            activeTab === "setting"
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-sm"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="text-[11px]">Settings</span>
        </button>
      </nav>

      {/* Main Content Area with Generous Luxury Negative Space */}
      <main className="max-w-5xl mx-auto px-5 sm:px-8 pt-28 sm:pt-36 pb-36 sm:pb-32 flex-1 w-full space-y-10 sm:space-y-14">
        {actionNotice && (
          <div
            className={`glass-panel p-4 rounded-2xl text-xs font-medium flex items-center gap-2.5 animate-in fade-in border shadow-lg ${
              actionNotice.type === "error"
                ? "border-red-500/30 text-red-700 dark:text-red-300"
                : "border-white/30 text-zinc-900 dark:text-white"
            }`}
          >
            {actionNotice.type === "error" ? (
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-zinc-200 shrink-0" />
            )}
            <span>{actionNotice.text}</span>
          </div>
        )}

        {/* TAB 1: DAILY CURRICULUM & BENTO GRID (ONLY ENROLLED COHORTS) */}
        {activeTab === "my_plan" && (
          <div className="space-y-10 sm:space-y-12">
            {!currentProgram ? (
              /* Empty state if user has NOT enrolled in any program yet */
              <div className="relative rounded-3xl overflow-hidden glass-panel border border-zinc-200/70 dark:border-white/10 p-10 sm:p-16 text-center flex flex-col items-center justify-center space-y-6 shadow-2xl min-h-[420px]">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <Image
                    src="/test.jpg"
                    alt=""
                    fill
                    className="object-cover scale-105 opacity-20 dark:opacity-10"
                  />
                </div>
                <div className="w-16 h-16 rounded-full glass-panel-subtle border border-zinc-200/60 dark:border-white/10 text-zinc-400 flex items-center justify-center relative z-10 shadow-sm">
                  <Calendar className="w-8 h-8" />
                </div>
                <div className="space-y-2.5 max-w-md relative z-10 font-mono">
                  <span className="text-micro text-zinc-500 dark:text-zinc-400 block tracking-[0.24em] uppercase font-semibold">
                    No Enrolled Cohort
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white font-geometric">
                    You haven&apos;t joined a cohort yet.
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-light leading-relaxed font-mono">
                    My Ritual exclusively displays the cohorts you are participating in. Explore our curated active curriculums to unlock your daily movement protocols, whole food plans, and community channel.
                  </p>
                </div>
                <div className="relative z-10 pt-2 font-mono">
                  <button
                    type="button"
                    onClick={() => setActiveTab("all_plan")}
                    className="px-7 py-3 rounded-full chrome-button text-xs font-semibold tracking-wide inline-flex items-center gap-2 shadow-xl transition duration-200"
                  >
                    <span>Explore Cohorts</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Cohort Switcher (ONLY shown if user is enrolled in multiple programs) */}
                {myEnrolledPrograms.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none font-mono">
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

                {/* Top 12-Column Editorial Bento Header */}
                <div className="grid lg:grid-cols-12 gap-6 items-stretch font-mono">
                  {/* Program Overview Card with Full Background Image (7 Columns) */}
                  <div className="lg:col-span-7 relative rounded-3xl overflow-hidden glass-panel border border-zinc-200/70 dark:border-white/10 p-7 sm:p-9 flex flex-col justify-between group shadow-xl min-h-[300px]">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <Image
                        src="/test.jpg"
                        alt=""
                        fill
                        className="object-cover object-center scale-100 group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/30 pointer-events-none" />

                    <div className="space-y-3 relative z-10 text-white font-mono">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-micro px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 uppercase tracking-[0.2em] text-white">
                          Active Cohort
                        </span>
                        {hasActiveAccess ? (
                          <span className="text-micro px-3 py-1 rounded-full chrome-badge text-white uppercase tracking-wider">
                            Active Access
                          </span>
                        ) : (
                          <span className="text-micro px-3 py-1 rounded-full bg-zinc-800/80 text-zinc-300 border border-white/10 backdrop-blur-md uppercase tracking-wider">
                            Tuition Pending
                          </span>
                        )}

                        {currentProgram.locationType === "ONSITE" && (
                          <span className="text-micro px-3 py-1 rounded-full bg-white/15 text-zinc-200 border border-white/20 backdrop-blur-md flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-zinc-300" />
                            <span>On-Site • {currentProgram.city || "Studio"}</span>
                          </span>
                        )}

                        {currentProgram.locationType === "HYBRID" && (
                          <span className="text-micro px-3 py-1 rounded-full bg-white/15 text-zinc-200 border border-white/20 backdrop-blur-md flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-zinc-300" />
                            <span>Hybrid • {currentProgram.city || "Studio"}</span>
                          </span>
                        )}

                        {(!currentProgram.locationType || currentProgram.locationType === "ONLINE") && (
                          <span className="text-micro px-3 py-1 rounded-full bg-white/15 text-zinc-200 border border-white/20 backdrop-blur-md">
                            Online Sanctuary
                          </span>
                        )}
                      </div>

                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight font-geometric">
                        {currentProgram.title}
                      </h1>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300 font-light font-mono">
                        {currentProgram.coachName && (
                          <span>Lead: <strong className="font-normal text-white">{currentProgram.coachName}</strong></span>
                        )}
                        <span>•</span>
                        <span>{formatShortDate(currentProgram.startDate)} – {formatShortDate(currentProgram.endDate)}</span>
                        {currentProgram.venueAddress && (
                          <>
                            <span>•</span>
                            <span className="text-zinc-300">Venue: {currentProgram.venueAddress}</span>
                          </>
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
                          className="px-4 py-2 rounded-full glass-image-overlay text-white text-xs font-medium border border-white/20 focus:outline-none"
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
                            className="px-6 py-2.5 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-semibold tracking-wide flex items-center gap-2 shadow-xl transition"
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
                    <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden border border-zinc-200/70 dark:border-white/10 shadow-lg">
                      <span className="text-micro text-zinc-400 block tracking-[0.2em] uppercase">
                        Current Day
                      </span>
                      <p className="text-3xl sm:text-4xl font-light tracking-tight text-zinc-900 dark:text-white my-2">
                        Day {currentActiveCalendarDay?.dayNumber || 1}
                        <span className="text-xs font-light text-zinc-400 ml-1.5">/ {totalDays}</span>
                      </p>
                      <span className="text-micro text-zinc-400">
                        00:00 Daily Unlock
                      </span>
                    </div>

                    <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden border border-zinc-200/70 dark:border-white/10 shadow-lg">
                      <span className="text-micro text-zinc-400 block tracking-[0.2em] uppercase">
                        Completed
                      </span>
                      <p className="text-3xl sm:text-4xl font-light tracking-tight text-zinc-900 dark:text-white my-2">
                        {completedDaysCount}
                        <span className="text-xs font-light text-zinc-400 ml-1.5">Days</span>
                      </p>
                      <span className="text-micro text-zinc-900 dark:text-zinc-200 font-medium font-mono">
                        {totalDays > 0 ? Math.round((completedDaysCount / totalDays) * 100) : 0}% Protocol Done
                      </span>
                    </div>

                    <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden border border-zinc-200/70 dark:border-white/10 shadow-lg">
                      <span className="text-micro text-zinc-400 block tracking-[0.2em] uppercase">
                        Skipped
                      </span>
                      <p className="text-3xl sm:text-4xl font-light tracking-tight text-zinc-900 dark:text-white my-2 font-geometric">
                        {skippedDaysCount}
                        <span className="text-xs font-light text-zinc-400 ml-1.5 font-mono">Missed</span>
                      </p>
                      <span className="text-micro text-zinc-500 font-mono">
                        23:59 Cutoff
                      </span>
                    </div>

                    <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden border border-zinc-200/70 dark:border-white/10 shadow-lg font-mono">
                      <span className="text-micro text-zinc-400 block tracking-[0.2em] uppercase">
                        Sanctuary
                      </span>
                      {currentProgram.communityLink && hasActiveAccess ? (
                        <a
                          href={currentProgram.communityLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="my-2 inline-flex items-center gap-1.5 text-base font-light text-zinc-900 dark:text-white hover:text-zinc-400 transition"
                        >
                          <span>Join Circle</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                        </a>
                      ) : (
                        <p className="text-base font-light text-zinc-400 my-2">
                          {hasActiveAccess ? "Active" : "Locked"}
                        </p>
                      )}
                      <span className="text-micro text-zinc-400">
                        Private Group
                      </span>
                    </div>
                  </div>
                </div>

                {/* Day Selector Timeline */}
                <div className="glass-panel p-6 sm:p-7 rounded-3xl space-y-4 border border-zinc-200/70 dark:border-white/10 shadow-xl font-mono">
                  <div className="flex items-center justify-between border-b border-zinc-900/[0.06] dark:border-white/10 pb-4">
                    <div className="space-y-0.5">
                      <span className="text-micro text-zinc-500 dark:text-zinc-400 block tracking-[0.24em] uppercase font-mono">
                        Curriculum Track
                      </span>
                      <h3 className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-white font-geometric">
                        Daily Schedule
                      </h3>
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-light font-mono">
                      23:59 Daily Streak Cutoff
                    </span>
                  </div>

                  <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none font-mono">
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
                          className={`min-w-[120px] p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between shrink-0 gap-3 font-mono ${
                            isSelected
                              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-transparent shadow-xl scale-[1.02]"
                              : isCompleted
                              ? "glass-panel-subtle border-white/30 text-zinc-700 dark:text-zinc-200"
                              : isSkipped
                              ? "glass-panel-subtle border-zinc-300 dark:border-white/10 text-zinc-500 opacity-60"
                              : isLockedFuture
                              ? "glass-panel-subtle border-zinc-200/40 dark:border-white/5 text-zinc-400 opacity-60"
                              : "glass-panel-subtle border-zinc-200/60 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-micro uppercase tracking-wider font-semibold">
                              Day {day.dayNumber}
                            </span>
                            {isCompleted ? (
                              <CheckCircle className={`w-3.5 h-3.5 ${isSelected ? "text-white dark:text-zinc-950" : "text-zinc-200"}`} />
                            ) : isSkipped ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-zinc-400" />
                            ) : isLockedFuture ? (
                              <Lock className="w-3.5 h-3.5 opacity-60" />
                            ) : (
                              <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : isToday ? "bg-white animate-pulse" : "bg-zinc-400"}`} />
                            )}
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[11px] block truncate font-medium">
                              {day.dayType === "TRAINING_DAY"
                                ? "Training"
                                : day.dayType === "REST_DAY"
                                ? "Recovery"
                                : "Connection"}
                            </span>
                            <span className="text-[10px] opacity-70 block font-light">
                              {formatShortDate(day.unlockDate)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Daily Content Bento Grid */}
                {currentDay && (
                  <div className="space-y-6 sm:space-y-8">
                    {/* Day Title Banner */}
                    <div className="glass-panel rounded-3xl p-7 sm:p-9 border border-zinc-200/70 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="text-micro uppercase tracking-[0.22em] font-semibold text-zinc-400 dark:text-zinc-500">
                            Day {currentDay.dayNumber} &bull; {formatShortDate(currentDay.unlockDate)}
                          </span>
                          <span className="text-micro uppercase tracking-[0.18em] font-semibold px-3 py-1 rounded-full glass-panel-subtle text-zinc-700 dark:text-zinc-300">
                            {currentDay.dayType === "TRAINING_DAY"
                              ? "Training &bull; Movement Sequence"
                              : currentDay.dayType === "REST_DAY"
                              ? "Recovery &bull; Parasympathetic"
                              : "Connection &bull; Live Circle"}
                          </span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-zinc-900 dark:text-white font-geometric">
                          {currentDay.title}
                        </h2>
                        {currentDay.dayType !== "REST_DAY" && (currentDay.coachName || currentDay.recommendedFor) && (
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono">
                            {currentDay.coachName && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full chrome-badge text-micro uppercase tracking-wider font-semibold font-mono">
                                Coach: {currentDay.coachName}
                              </span>
                            )}
                            {currentDay.recommendedFor && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 text-micro uppercase tracking-wider font-medium font-mono">
                                Target: {currentDay.recommendedFor}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0 font-mono">
                        {currentDay.userProgress?.isCompleted ? (
                          <span className="inline-flex items-center gap-2 text-xs font-medium text-zinc-900 dark:text-white bg-white/10 border border-white/20 px-4 py-2 rounded-full">
                            <CheckCircle className="w-4 h-4 text-white" /> Day Completed
                          </span>
                        ) : currentDay.isSkipped ? (
                          <span className="inline-flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 glass-panel-subtle border border-zinc-200/60 dark:border-white/10 px-4 py-2 rounded-full">
                            <AlertTriangle className="w-4 h-4 text-zinc-400" /> Past Cutoff
                          </span>
                        ) : !currentDay.isCalendarUnlocked ? (
                          <span className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 glass-panel-subtle px-4 py-2 rounded-full">
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
                              className={`px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition flex items-center gap-2 font-mono ${
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

                    {/* Today Push Notification Schedule Banner */}
                    {hasActiveAccess && currentDay.isCalendarUnlocked && currentDay.dayNotifications && currentDay.dayNotifications.length > 0 && (
                      <div className="glass-panel rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs border border-zinc-200/60 dark:border-white/10 font-mono">
                        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                          <Bell className="w-4 h-4 text-zinc-400 shrink-0" />
                          <span className="text-micro uppercase tracking-[0.2em] font-semibold text-zinc-900 dark:text-white font-mono">
                            Today&apos;s Dispatch Schedule
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 font-mono">
                          {currentDay.dayNotifications.map((notif, i) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 rounded-full glass-panel-subtle text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-2"
                              title={notif.message}
                            >
                              <Clock className="w-3 h-3 text-zinc-400" />
                              <strong className="text-zinc-900 dark:text-white font-medium">{notif.time}</strong>
                              <span className="truncate max-w-[140px] sm:max-w-[220px] font-light">{notif.message}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* GATE 1: Unpaid User */}
                    {!hasActiveAccess ? (
                      <div className="glass-panel rounded-3xl p-10 sm:p-14 text-center space-y-5 border border-zinc-200/70 dark:border-white/10">
                        <div className="w-12 h-12 rounded-full glass-panel-subtle flex items-center justify-center mx-auto text-zinc-400">
                          <Lock className="w-5 h-5 stroke-[1.5]" />
                        </div>
                        <div className="space-y-2">
                          <span className="text-micro uppercase tracking-[0.24em] font-semibold text-zinc-400 dark:text-zinc-500 block">
                            Member Sanctuary Protocol
                          </span>
                          <h3 className="text-xl sm:text-2xl font-light tracking-tight text-zinc-900 dark:text-white">
                            Members-Only Curriculum
                          </h3>
                          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed font-light">
                            Enroll in this cohort to unlock daily movement sequences, circadian recovery guidance, and personalized self-assessments.
                          </p>
                        </div>
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => handleOpenQrisCheckout(currentProgram.id)}
                            disabled={enrollingId === currentProgram.id}
                            className="px-8 py-3.5 rounded-full chrome-button text-xs font-semibold tracking-wide inline-flex items-center gap-2.5 shadow-lg"
                          >
                            <QrCode className="w-4 h-4" /> Enroll Now &bull; Rp{" "}
                            {currentProgram.price.toLocaleString("id-ID")}
                          </button>
                        </div>
                      </div>
                    ) : !currentDay.isCalendarUnlocked ? (
                      /* GATE 2: Future Calendar Day */
                      <div className="glass-panel rounded-3xl p-10 sm:p-14 text-center space-y-4 border border-zinc-200/70 dark:border-white/10">
                        <div className="w-12 h-12 rounded-full glass-panel-subtle flex items-center justify-center mx-auto text-zinc-400">
                          <Clock className="w-5 h-5 stroke-[1.5]" />
                        </div>
                        <div className="space-y-2">
                          <span className="text-micro uppercase tracking-[0.24em] font-semibold text-zinc-400 dark:text-zinc-500 block">
                            Temporal Alignment
                          </span>
                          <h3 className="text-xl sm:text-2xl font-light tracking-tight text-zinc-900 dark:text-white">
                            Scheduled for {formatShortDate(currentDay.unlockDate)}
                          </h3>
                          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed font-light">
                            Day {currentDay.dayNumber} unlocks at midnight (00:00 WIB) on{" "}
                            <span className="text-zinc-900 dark:text-white font-medium">
                              {formatShortDate(currentDay.unlockDate)}
                            </span>{" "}
                            in synchronization with your batch cohort.
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* UNLOCKED 3-PHASE CURRICULUM LAYOUT */
                      <div className="space-y-6 sm:space-y-8">
                        {/* 1. FASE PAGI: SLEEP & RECOVERY LOG */}
                        <SleepTrackerCard
                          dayNumber={currentDay.dayNumber}
                          sleepRecommendation={currentDay.sleepRecommendation || null}
                          initialBedtime={dayBedtimes[currentDay.id] || currentDay.userProgress?.bedtime || "22:30"}
                          initialWakeTime={dayWakeTimes[currentDay.id] || currentDay.userProgress?.wakeTime || "06:30"}
                          initialSleepMinutes={currentDay.userProgress?.sleepDurationMinutes}
                          isPast2359={currentDay.isPast2359}
                          onSaveSleep={handleSaveSleep}
                        />

                        {/* 2. FASE SIANG: MAIN CURRICULUM PROTOCOL (TRAINING / REST / CONNECTION) */}
                        {currentDay.dayType === "TRAINING_DAY" ? (
                          <div className="grid lg:grid-cols-12 gap-6 items-start">
                            {/* Left (7 Columns): Video YouTube Premium Card & Workout Section */}
                            <div className="lg:col-span-7 space-y-6">
                              <VideoThumbnailLinkCard
                                title={currentDay.title}
                                videoUrl={currentDay.videoUrl}
                                videoWatched={getVideoWatched(currentDay)}
                                isPast2359={currentDay.isPast2359}
                                onToggleWatched={handleToggleVideoWatched}
                              />

                              <WorkoutSection
                                dayNumber={currentDay.dayNumber}
                                availableOptions={currentDay.workoutOptions || []}
                                selectedWorkout={dayWorkouts[currentDay.id] || currentDay.userProgress?.selectedWorkout}
                                photoBeforeUrl={dayPhotosBefore[currentDay.id] || currentDay.userProgress?.photoBeforeUrl}
                                photoAfterUrl={dayPhotosAfter[currentDay.id] || currentDay.userProgress?.photoAfterUrl}
                                workoutNotes={dayWorkoutNotes[currentDay.id] !== undefined ? dayWorkoutNotes[currentDay.id] : currentDay.userProgress?.workoutNotes}
                                checklist={currentDay.videoChecklist || []}
                                completedChecklist={getCheckedItems(currentDay)}
                                isPast2359={currentDay.isPast2359}
                                onSelectWorkout={handleSelectWorkout}
                                onUploadPhoto={handleUploadPhoto}
                                onToggleChecklistItem={handleToggleChecklist}
                                onSaveWorkoutNotes={handleSaveWorkoutNotes}
                                onUpdateChecklistRep={handleUpdateChecklistRep}
                              />
                            </div>

                            {/* Right (5 Columns): Meal Recommendation & Compliance */}
                            <div className="lg:col-span-5 space-y-6">
                              <MealSection
                                mealRecommendation={currentDay.mealRecommendation}
                                initialCompliance={dayMealCompliance[currentDay.id] || currentDay.userProgress?.mealCompliance || "FULL"}
                                initialNotes={dayMealNotes[currentDay.id] !== undefined ? dayMealNotes[currentDay.id] : currentDay.userProgress?.mealNotes || ""}
                                isPast2359={currentDay.isPast2359}
                                onSaveMeal={handleSaveMeal}
                              />
                            </div>
                          </div>
                        ) : currentDay.dayType === "REST_DAY" ? (
                          <div className="grid lg:grid-cols-12 gap-6 items-start">
                            <div className="lg:col-span-7 space-y-6">
                              <div className="glass-panel rounded-3xl p-7 sm:p-9 space-y-6 border border-zinc-200/70 dark:border-white/10 group">
                                <div className="space-y-1">
                                  <span className="text-micro uppercase tracking-[0.22em] font-semibold text-zinc-400 dark:text-zinc-500 block">
                                    Phase 02 &bull; Parasympathetic Restoration
                                  </span>
                                  <h3 className="text-xl sm:text-2xl font-light tracking-tight text-zinc-900 dark:text-white">
                                    Rest &amp; Deep Recovery
                                  </h3>
                                </div>

                                <div className="relative h-64 w-full rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-200/80 dark:border-white/10">
                                  <Image
                                    src="/image.jpg"
                                    alt="Rest Day"
                                    fill
                                    className="object-cover scale-110 blur-[1px] group-hover:blur-0 group-hover:scale-105 transition-all duration-700"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                                  <div className="absolute bottom-5 left-5 right-5 p-4 rounded-2xl glass-image-overlay backdrop-blur-xl border border-white/15">
                                    <span className="text-micro uppercase tracking-[0.2em] text-zinc-300 block mb-0.5">
                                      Circadian Regeneration
                                    </span>
                                    <h4 className="text-sm sm:text-base font-light text-white tracking-tight">
                                      {currentDay.title}
                                    </h4>
                                  </div>
                                </div>

                                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-light whitespace-pre-line">
                                  {currentDay.restInstructions ||
                                    "Take a gentle 25-minute sunlight walk, practice box breathing, and allow somatic tissues to fully decompress."}
                                </p>
                              </div>
                            </div>

                            <div className="lg:col-span-5 space-y-6">
                              <MealSection
                                mealRecommendation={currentDay.mealRecommendation}
                                initialCompliance={dayMealCompliance[currentDay.id] || currentDay.userProgress?.mealCompliance || "FULL"}
                                initialNotes={dayMealNotes[currentDay.id] !== undefined ? dayMealNotes[currentDay.id] : currentDay.userProgress?.mealNotes || ""}
                                isPast2359={currentDay.isPast2359}
                                onSaveMeal={handleSaveMeal}
                              />
                            </div>
                          </div>
                        ) : (
                          /* CONNECTION_DAY / MEETUP_DAY */
                          <div className="grid lg:grid-cols-12 gap-6 items-start">
                            <div className="lg:col-span-7 space-y-6">
                              <div className="glass-panel rounded-3xl p-7 sm:p-9 space-y-6 border border-zinc-200/70 dark:border-white/10 group">
                                <div className="space-y-1">
                                  <span className="text-micro uppercase tracking-[0.22em] font-semibold text-zinc-400 dark:text-zinc-500 block">
                                    Phase 02 &bull; Connection Sanctuary
                                  </span>
                                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white font-geometric">
                                    {currentDay.eventTitle || "Community & Facetime Circle"}
                                  </h3>
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-light font-mono">
                                    In-person immersion, mentor alignment, and community synergy.
                                  </p>
                                </div>

                                <div className="relative h-60 w-full rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-200/80 dark:border-white/10">
                                  <Image
                                    src="/image.jpg"
                                    alt="Connection Day"
                                    fill
                                    className="object-cover object-right scale-110 blur-[1px] group-hover:blur-0 group-hover:scale-105 transition-all duration-700"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                                  <div className="absolute bottom-5 left-5 right-5 p-4 rounded-2xl glass-image-overlay backdrop-blur-xl border border-white/15">
                                    <span className="text-micro uppercase tracking-[0.2em] text-zinc-300 block mb-0.5">
                                      Live Immersion
                                    </span>
                                    <h4 className="text-sm sm:text-base font-light text-white tracking-tight">
                                      {currentDay.title}
                                    </h4>
                                  </div>
                                </div>

                                {/* Event Details 2-Column Grid */}
                                <div className="grid sm:grid-cols-2 gap-4 font-mono">
                                  {/* Schedule */}
                                  <div className="p-4 sm:p-5 rounded-2xl glass-panel-subtle space-y-1 border border-zinc-200/60 dark:border-white/10">
                                    <span className="text-micro uppercase tracking-[0.2em] font-semibold text-zinc-400 flex items-center gap-1.5 font-mono">
                                      <Clock className="w-3.5 h-3.5 text-zinc-400" /> Session Schedule
                                    </span>
                                    <p className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-white font-mono">
                                      {currentDay.onsiteSchedule || "09:00 AM – 11:30 AM WIB"}
                                    </p>
                                  </div>

                                  {/* Venue */}
                                  <div className="p-4 sm:p-5 rounded-2xl glass-panel-subtle space-y-1 border border-zinc-200/60 dark:border-white/10">
                                    <span className="text-micro uppercase tracking-[0.2em] font-semibold text-zinc-400 flex items-center gap-1.5 font-mono">
                                      <MapPin className="w-3.5 h-3.5 text-zinc-400" /> Sanctuary Venue
                                    </span>
                                    <p className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-white font-mono">
                                      {currentDay.onsiteVenue ||
                                        currentProgram.venueAddress ||
                                        "The BMS Sanctuary, Senopati, Jakarta"}
                                    </p>
                                  </div>

                                  {/* Host / Who You Will Meet */}
                                  <div className="p-4 sm:p-5 rounded-2xl glass-panel-subtle space-y-1 border border-zinc-200/60 dark:border-white/10">
                                    <span className="text-micro uppercase tracking-[0.2em] font-semibold text-zinc-400 flex items-center gap-1.5 font-mono">
                                      <Users className="w-3.5 h-3.5 text-zinc-400" /> Who You Will Meet
                                    </span>
                                    <p className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-white font-mono">
                                      {currentDay.eventHost || currentDay.coachName || currentProgram.coachName || "Coach & Community Leads"}
                                    </p>
                                  </div>

                                  {/* Google Maps Link */}
                                  <div className="p-4 sm:p-5 rounded-2xl glass-panel-subtle space-y-2 border border-zinc-200/60 dark:border-white/10 flex flex-col justify-between">
                                    <span className="text-micro uppercase tracking-[0.2em] font-semibold text-zinc-400 flex items-center gap-1.5 font-mono">
                                      <Compass className="w-3.5 h-3.5 text-zinc-400" /> Venue Navigation
                                    </span>
                                    {currentDay.mapLink ? (
                                      <a
                                        href={currentDay.mapLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 transition w-fit"
                                      >
                                        <span>Open Google Maps</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    ) : (
                                      <span className="text-xs text-zinc-400 font-light">
                                        Location details confirmed via member chat
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Event Rundown / Details */}
                                {currentDay.eventDetails && (
                                  <div className="p-5 rounded-2xl glass-panel-subtle border border-zinc-200/70 dark:border-white/10 space-y-2 font-mono">
                                    <span className="text-micro uppercase tracking-[0.2em] font-semibold text-zinc-400 block font-mono">
                                      Event Details &amp; Agenda Rundown
                                    </span>
                                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-light whitespace-pre-line font-mono">
                                      {currentDay.eventDetails}
                                    </p>
                                  </div>
                                )}

                                {/* Virtual Stream Link for Remote Members */}
                                {currentDay.meetupLink && (
                                  <div className="p-5 rounded-2xl glass-panel-subtle border border-zinc-200/70 dark:border-white/10 space-y-3 font-mono">
                                    <div className="flex items-center gap-2 text-micro uppercase tracking-[0.2em] font-semibold text-zinc-500 dark:text-zinc-400 font-mono">
                                      <Video className="w-3.5 h-3.5 text-zinc-400" />
                                      <span>Virtual Broadcast &bull; Remote Access</span>
                                    </div>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-light font-mono">
                                      For remote members unable to attend the studio physically, access the live high-definition broadcast:
                                    </p>
                                    <a
                                      href={currentDay.meetupLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full chrome-button text-xs font-semibold tracking-wide shadow-sm font-mono"
                                    >
                                      <span>Join Live Stream</span>
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                )}

                                {/* Member Event Feedback Note Input */}
                                <div className="p-6 rounded-2xl glass-panel-subtle border border-zinc-200/70 dark:border-white/10 space-y-3 font-mono">
                                  <div className="space-y-1">
                                    <span className="text-micro uppercase tracking-[0.2em] font-semibold text-zinc-400 block font-mono">
                                      Member Event Feedback Note
                                    </span>
                                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
                                      How was your Connect Day experience?
                                    </h4>
                                    <p className="text-xs text-zinc-500 font-light">
                                      Share key takeaways, circle highlights, or reflections from today&apos;s session.
                                    </p>
                                  </div>

                                  <textarea
                                    rows={3}
                                    disabled={currentDay.isPast2359}
                                    value={
                                      dayEventFeedback[currentDay.id] !== undefined
                                        ? dayEventFeedback[currentDay.id]
                                        : currentDay.userProgress?.eventFeedback || ""
                                    }
                                    onChange={(e) => {
                                      const text = e.target.value;
                                      setDayEventFeedback((p) => ({ ...p, [currentDay.id]: text }));
                                    }}
                                    placeholder="e.g. Loved connecting with the coach and community in person! The alignment cues were transformative..."
                                    className="w-full p-4 rounded-xl glass-input text-xs sm:text-sm font-light text-zinc-900 dark:text-white leading-relaxed resize-none transition focus:ring-1 focus:ring-white/40 font-mono"
                                  />

                                  {!currentDay.isPast2359 && (
                                    <div className="flex justify-end pt-1">
                                      <button
                                        type="button"
                                        disabled={isSavingFeedback}
                                        onClick={() => {
                                          const val =
                                            dayEventFeedback[currentDay.id] !== undefined
                                              ? dayEventFeedback[currentDay.id]
                                              : currentDay.userProgress?.eventFeedback || "";
                                          handleSaveEventFeedback(val);
                                        }}
                                        className="px-6 py-2.5 rounded-full chrome-button text-xs font-semibold tracking-wide flex items-center gap-2 transition duration-200 shadow-md font-mono"
                                      >
                                        {isSavingFeedback ? (
                                          <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Saving...</span>
                                          </>
                                        ) : feedbackSaved ? (
                                          <>
                                            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-950" />
                                            <span>Saved</span>
                                          </>
                                        ) : (
                                          <span>Save Event Feedback</span>
                                        )}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="lg:col-span-5 space-y-6">
                              <MealSection
                                mealRecommendation={currentDay.mealRecommendation}
                                initialCompliance={dayMealCompliance[currentDay.id] || currentDay.userProgress?.mealCompliance || "FULL"}
                                initialNotes={dayMealNotes[currentDay.id] !== undefined ? dayMealNotes[currentDay.id] : currentDay.userProgress?.mealNotes || ""}
                                isPast2359={currentDay.isPast2359}
                                onSaveMeal={handleSaveMeal}
                              />
                            </div>
                          </div>
                        )}

                        {/* 3. FASE MALAM: DEAR DIARY REFLECTION & HAPPINESS RATE */}
                        <DailyReflectionCard
                          dayNumber={currentDay.dayNumber}
                          initialReflection={dayReflections[currentDay.id] !== undefined ? dayReflections[currentDay.id] : currentDay.userProgress?.dailyReflection || ""}
                          initialHappinessRate={dayHappiness[currentDay.id] || currentDay.userProgress?.happinessRate || 5}
                          isPast2359={currentDay.isPast2359}
                          onSaveReflection={handleSaveReflection}
                        />
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
          <div className="space-y-8 sm:space-y-10">
            <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-zinc-200/70 dark:border-white/10 space-y-3">
              <div className="flex items-center gap-2 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
                <span className="text-micro uppercase tracking-[0.24em] font-semibold text-zinc-400 dark:text-zinc-500 font-mono">
                  Curated Cohorts
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extralight tracking-tight text-zinc-900 dark:text-white font-geometric">
                Longevity &amp; Movement <span className="font-geometric italic text-zinc-500 dark:text-zinc-400 font-light">Protocols</span>
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xl font-light leading-relaxed">
                Choose your structured longevity and movement protocol. Strictly capped at 35 members per cohort to preserve intimate coach attention.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
              {allPrograms.map((prog, idx) => {
                const enrolled = myPrograms.find((e) => e.programId === prog.id);
                const isActive = enrolled?.status === "ACTIVE";
                const remainingSlots = Math.max(0, prog.maxQuota - prog.enrolledCount);

                return (
                  <div
                    key={prog.id}
                    className="relative rounded-3xl overflow-hidden glass-panel border border-zinc-200/70 dark:border-white/10 min-h-[460px] p-7 sm:p-8 flex flex-col justify-between group shadow-xl"
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 pointer-events-none" />

                    {/* Top Badges */}
                    <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 font-mono">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-full glass-image-overlay text-micro uppercase tracking-[0.2em] font-semibold text-white">
                          {prog.dayCount} Days
                        </span>

                        {prog.locationType === "ONSITE" && (
                          <span className="px-3 py-1 rounded-full glass-image-overlay border border-white/20 text-micro uppercase tracking-wider font-semibold text-zinc-200 backdrop-blur-md flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-zinc-300" />
                            <span>On-Site &bull; {prog.city || "Studio"}</span>
                          </span>
                        )}

                        {prog.locationType === "HYBRID" && (
                          <span className="px-3 py-1 rounded-full glass-image-overlay border border-white/20 text-micro uppercase tracking-wider font-semibold text-zinc-200 backdrop-blur-md flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-zinc-300" />
                            <span>Hybrid &bull; {prog.city || "Studio"}</span>
                          </span>
                        )}

                        {(!prog.locationType || prog.locationType === "ONLINE") && (
                          <span className="px-3 py-1 rounded-full glass-image-overlay border border-white/20 text-micro uppercase tracking-wider font-semibold text-zinc-200 backdrop-blur-md">
                            Online Protocol
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {prog.status === "COMING_SOON" ? (
                          <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20 text-micro uppercase tracking-[0.2em] font-semibold text-zinc-200 backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-pulse" />
                            <span>Coming Soon</span>
                          </span>
                        ) : isActive ? (
                          <span className="px-3 py-1 rounded-full chrome-badge text-white text-micro uppercase tracking-[0.2em] font-semibold">
                            Active Plan
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full glass-image-overlay text-micro uppercase tracking-wider font-medium text-white flex items-center gap-1.5">
                            <Users className="w-3 h-3 text-zinc-300" />
                            <span>{remainingSlots} spots left</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Floating Glassmorphic Content Card */}
                    <div className="relative z-10 glass-image-overlay rounded-2xl p-6 space-y-4 text-white border border-white/15 backdrop-blur-xl">
                      <div className="space-y-1.5 font-mono">
                        <div className="flex items-center gap-2 text-micro uppercase tracking-[0.18em] text-zinc-300 font-medium">
                          <span>{prog.coachName}</span>
                          <span>&bull;</span>
                          <span>Starts {formatShortDate(prog.startDate)}</span>
                        </div>

                        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-geometric">
                          {prog.title}
                        </h3>

                        <p className="text-xs text-zinc-200/90 line-clamp-2 leading-relaxed font-light font-mono">
                          {prog.description}
                        </p>

                        {prog.locationType !== "ONLINE" && prog.virtualFallbackAvailable && (
                          <div className="pt-1 flex items-center gap-1.5 text-micro uppercase tracking-wider text-zinc-300 font-medium font-mono">
                            <Video className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                            <span>Live streaming broadcast included</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-white/15 flex items-center justify-between gap-3 font-mono">
                        <div>
                          <span className="text-micro uppercase tracking-[0.2em] text-zinc-400 block mb-0.5">
                            {prog.status === "COMING_SOON" ? "Registration" : "Tuition"}
                          </span>
                          {prog.status === "COMING_SOON" ? (
                            <span className="text-xs font-medium text-zinc-300">
                              {prog.registrationOpenDate
                                ? `Opens ${formatShortDate(prog.registrationOpenDate)}`
                                : "Announced Soon (TBA)"}
                            </span>
                          ) : (
                            <span className="text-base font-bold text-white tracking-tight">
                              Rp {prog.price.toLocaleString("id-ID")}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailedProgram(prog)}
                            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition"
                            title="View Overview"
                          >
                            <Info className="w-4 h-4" />
                          </button>

                          {prog.status === "COMING_SOON" ? (
                            <a
                              href={`https://wa.me/6281290002026?text=${encodeURIComponent(`Halo BMS Concierge, saya ingin bergabung ke waitlist untuk cohort: ${prog.title}`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-5 py-2.5 rounded-full chrome-button text-xs font-semibold tracking-wide inline-flex items-center gap-1.5 transition shadow"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Waitlist</span>
                            </a>
                          ) : isActive ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProgId(prog.id);
                                setActiveDayIndex(0);
                                setActiveTab("my_plan");
                              }}
                              className="px-5 py-2.5 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-semibold tracking-wide inline-flex items-center gap-1.5 transition shadow"
                            >
                              <span>Open Plan</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenQrisCheckout(prog.id)}
                              disabled={enrollingId === prog.id}
                              className="px-6 py-2.5 rounded-full chrome-button text-xs font-semibold tracking-wide inline-flex items-center gap-1.5 transition shadow"
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
          <div className="max-w-3xl mx-auto space-y-8 sm:space-y-10">
            <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-zinc-200/70 dark:border-white/10 space-y-3">
              <div className="flex items-center gap-2 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
                <span className="text-micro uppercase tracking-[0.24em] font-semibold text-zinc-400 dark:text-zinc-500 font-mono">
                  Preferences &amp; Credentials
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extralight tracking-tight text-zinc-900 dark:text-white font-geometric">
                Account <span className="font-geometric italic text-zinc-500 dark:text-zinc-400 font-light">Settings</span>
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-light leading-relaxed">
                Manage your personal profile, notification schedule, credentials, and app preferences.
              </p>
            </div>

            {/* 1. Profile Information */}
            <form
              onSubmit={handleUpdateProfile}
              className="glass-panel rounded-3xl p-7 sm:p-9 space-y-6 border border-zinc-200/70 dark:border-white/10 shadow-sm"
            >
              <div className="space-y-1">
                <span className="text-micro uppercase tracking-[0.22em] font-semibold text-zinc-400 dark:text-zinc-500 block">
                  Identity Details
                </span>
                <h3 className="text-lg font-light tracking-tight text-zinc-900 dark:text-white font-geometric">
                  Profile Information
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-light">
                  Update your contact details and display name within BMS.
                </p>
              </div>

              {profileMsg && (
                <div
                  className={`p-4 rounded-2xl text-xs font-medium font-mono ${
                    profileMsg.type === "success"
                      ? "bg-white/10 border border-white/20 text-zinc-900 dark:text-white"
                      : "bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300"
                  }`}
                >
                  {profileMsg.text}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-micro uppercase tracking-[0.2em] font-semibold text-zinc-400 dark:text-zinc-500 mb-2">
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
                    className="w-full px-4 py-3 rounded-2xl glass-input text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-micro uppercase tracking-[0.2em] font-semibold text-zinc-400 dark:text-zinc-500 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full px-4 py-3 rounded-2xl glass-panel-subtle text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 cursor-not-allowed border border-zinc-200/50 dark:border-white/5"
                  />
                </div>

                <div>
                  <label className="block text-micro uppercase tracking-[0.2em] font-semibold text-zinc-400 dark:text-zinc-500 mb-2">
                    WhatsApp / Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +62 812..."
                    value={profileForm.phone}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-2xl glass-input text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 text-right">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="px-6 py-2.5 rounded-full chrome-button text-xs font-semibold tracking-wide shadow-sm"
                >
                  {isUpdatingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>

            {/* 2. Daily Reminders & Alerts */}
            <div className="glass-panel rounded-3xl p-7 sm:p-9 space-y-6 border border-zinc-200/70 dark:border-white/10 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-micro uppercase tracking-[0.22em] font-semibold text-zinc-400 dark:text-zinc-500 block">
                    Circadian Push Notifications
                  </span>
                  <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2 font-geometric">
                    <Bell className="w-4 h-4 text-zinc-400" />
                    <span>Daily Reminder Schedule</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-light">
                    Synchronize reminders for your morning practice and evening 23:59 checklist cutoff.
                  </p>
                </div>
                <span className="text-micro uppercase tracking-[0.18em] font-semibold px-3 py-1 rounded-full glass-panel-subtle shrink-0 text-zinc-700 dark:text-zinc-300">
                  {notifPermission === "granted" ? "Active" : "Disabled"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-micro uppercase tracking-[0.2em] font-semibold text-zinc-400 dark:text-zinc-500 mb-2">
                    Morning Routine
                  </label>
                  <input
                    type="time"
                    value={morningTime}
                    onChange={(e) => setMorningTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl glass-input text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-micro uppercase tracking-[0.2em] font-semibold text-zinc-400 dark:text-zinc-500 mb-2">
                    Evening Cutoff (23:59)
                  </label>
                  <input
                    type="time"
                    value={eveningTime}
                    onChange={(e) => setEveningTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl glass-input text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleEnableNotifications}
                  className="px-6 py-2.5 rounded-full chrome-button text-xs font-semibold tracking-wide shadow-sm"
                >
                  {notifPermission === "granted"
                    ? "Save Schedule"
                    : "Enable Notifications"}
                </button>
                <button
                  type="button"
                  onClick={() => handleTestReminder("morning")}
                  className="px-5 py-2.5 rounded-full glass-panel-subtle text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 transition"
                >
                  Test Morning Alert
                </button>
                <button
                  type="button"
                  onClick={() => handleTestReminder("evening")}
                  className="px-5 py-2.5 rounded-full glass-panel-subtle text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 transition"
                >
                  Test Evening Alert
                </button>
              </div>

              {/* PWA Home Screen Guide */}
              <div className="pt-5 border-t border-zinc-200/60 dark:border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-micro uppercase tracking-[0.2em] font-semibold text-zinc-900 dark:text-white font-mono">
                  <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Install on Home Screen (PWA Sanctuary)</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-light">
                  For native ambient immersion and reliable push alerts, install BMS onto your device home screen:
                </p>
                <ol className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 list-decimal list-inside font-light">
                  <li>In <strong>Safari (iOS)</strong>, tap Share &rarr; &ldquo;Add to Home Screen&rdquo;.</li>
                  <li>In <strong>Chrome (Android)</strong>, tap Menu (3 dots) &rarr; &ldquo;Install app&rdquo;.</li>
                </ol>
              </div>
            </div>

            {/* 3. Security & Password */}
            <form
              onSubmit={handleChangePassword}
              className="glass-panel rounded-3xl p-7 sm:p-9 space-y-6 border border-zinc-200/70 dark:border-white/10 shadow-sm"
            >
              <div className="space-y-1">
                <span className="text-micro uppercase tracking-[0.22em] font-semibold text-zinc-400 dark:text-zinc-500 block">
                  Access Security
                </span>
                <h3 className="text-lg font-light tracking-tight text-zinc-900 dark:text-white">
                  Change Password
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-light">
                  Ensure your account is protected with a resilient credentials passphrase.
                </p>
              </div>

              {passwordMsg && (
                <div
                  className={`p-4 rounded-2xl text-xs font-medium font-mono ${
                    passwordMsg.type === "success"
                      ? "bg-white/10 border border-white/20 text-zinc-900 dark:text-white"
                      : "bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300"
                  }`}
                >
                  {passwordMsg.text}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-micro uppercase tracking-[0.2em] font-semibold text-zinc-400 dark:text-zinc-500 mb-2">
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
                      className="w-full pl-4 pr-12 py-3 rounded-2xl glass-input text-xs sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setPeekCurrentPass(!peekCurrentPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    >
                      {peekCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-micro uppercase tracking-[0.2em] font-semibold text-zinc-400 dark:text-zinc-500 mb-2">
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
                      className="w-full pl-4 pr-12 py-3 rounded-2xl glass-input text-xs sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setPeekNewPass(!peekNewPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    >
                      {peekNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-micro uppercase tracking-[0.2em] font-semibold text-zinc-400 dark:text-zinc-500 mb-2">
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
                      className="w-full pl-4 pr-12 py-3 rounded-2xl glass-input text-xs sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setPeekConfirmPass(!peekConfirmPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
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
                  className="px-6 py-2.5 rounded-full chrome-button text-xs font-semibold tracking-wide shadow-sm"
                >
                  {isChangingPass ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>

            {/* 4. Danger Zone */}
            <div className="glass-panel rounded-3xl p-7 sm:p-9 border border-red-500/20 space-y-4 shadow-sm">
              <span className="text-micro uppercase tracking-[0.22em] font-semibold text-red-500 block">
                Irreversible Action
              </span>
              <h3 className="text-lg font-light tracking-tight text-red-600 dark:text-red-400">
                Delete Account
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-light">
                Permanently purge your BMS account, personal logs, streak histories, and active cohort enrollments. This cannot be reversed.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(true)}
                  className="px-5 py-2.5 rounded-full border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 text-xs font-medium tracking-wide transition"
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
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <span className="text-micro uppercase tracking-[0.22em] font-semibold text-zinc-400 dark:text-zinc-500 block">
                  Curriculum Overview
                </span>
                <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-light">
                  {detailedProgram.description}
                </p>
                {detailedProgram.recommendedFor && (
                  <div className="p-4 rounded-2xl glass-panel-subtle text-xs">
                    <span className="text-micro uppercase tracking-wider font-semibold text-zinc-900 dark:text-white block mb-1">
                      Recommended For:
                    </span>
                    <span className="text-zinc-600 dark:text-zinc-300 font-light">
                      {detailedProgram.recommendedFor}
                    </span>
                  </div>
                )}
              </div>

              {/* Program Schedule Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-2xl glass-panel-subtle space-y-1">
                  <span className="text-micro uppercase tracking-wider text-zinc-400 block">
                    Lead Coach
                  </span>
                  <strong className="font-medium text-zinc-900 dark:text-white">
                    {detailedProgram.coachName}
                  </strong>
                </div>

                <div className="p-4 rounded-2xl glass-panel-subtle space-y-1">
                  <span className="text-micro uppercase tracking-wider text-zinc-400 block">
                    Tuition Fee
                  </span>
                  <strong className="font-light text-zinc-900 dark:text-white">
                    Rp {detailedProgram.price.toLocaleString("id-ID")}
                  </strong>
                </div>

                <div className="p-4 rounded-2xl glass-panel-subtle space-y-1">
                  <span className="text-micro uppercase tracking-wider text-zinc-400 block">
                    Start Date
                  </span>
                  <strong className="font-medium text-zinc-900 dark:text-white">
                    {new Date(detailedProgram.startDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </strong>
                </div>

                <div className="p-4 rounded-2xl glass-panel-subtle space-y-1">
                  <span className="text-micro uppercase tracking-wider text-zinc-400 block">
                    Seats Availability
                  </span>
                  <strong className="font-medium text-zinc-900 dark:text-white">
                    {Math.max(0, detailedProgram.maxQuota - detailedProgram.enrolledCount)} of {detailedProgram.maxQuota} Spots Open
                  </strong>
                </div>
              </div>

              {/* What Happens Daily */}
              <div className="space-y-3">
                <span className="text-micro uppercase tracking-[0.22em] font-semibold text-zinc-400 dark:text-zinc-500 block">
                  Daily Protocol Cadence
                </span>
                <div className="space-y-2.5 font-mono">
                  <div className="flex items-start gap-3 p-3.5 rounded-2xl glass-panel-subtle text-xs">
                    <Clock className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold text-zinc-900 dark:text-white block font-mono">
                        00:00 Morning Session Unlock
                      </strong>
                      <span className="text-zinc-500 dark:text-zinc-400 text-xs font-light font-mono">
                        New workout video & anti-inflammatory meal guide ready each day.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl glass-panel-subtle text-xs">
                    <CheckCircle className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold text-zinc-900 dark:text-white block font-mono">
                        23:59 Daily Streak Cutoff
                      </strong>
                      <span className="text-zinc-500 dark:text-zinc-400 text-xs font-light font-mono">
                        Mark your video watched and checklist complete before midnight.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-5 border-t border-zinc-200/60 dark:border-white/10 flex items-center justify-between gap-3 bg-white/40 dark:bg-white/[0.02] font-mono">
              <button
                type="button"
                onClick={() => setDetailedProgram(null)}
                className="px-5 py-2.5 rounded-full glass-panel-subtle text-xs font-medium text-zinc-700 dark:text-zinc-300 font-mono"
              >
                Close
              </button>

              {(() => {
                const enrolled = myPrograms.find((e) => e.programId === detailedProgram.id);
                const isActive = enrolled?.status === "ACTIVE";

                if (detailedProgram.status === "COMING_SOON") {
                  return (
                    <a
                      href={`https://wa.me/6281290002026?text=${encodeURIComponent(`Halo BMS Concierge, saya ingin bergabung ke waitlist untuk cohort: ${detailedProgram.title}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-2.5 rounded-full chrome-button text-xs font-semibold tracking-wide flex items-center gap-2 transition font-mono shadow-md"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-zinc-400" /> Join Waitlist
                    </a>
                  );
                }

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
                      className="px-6 py-2.5 rounded-full chrome-button text-xs font-semibold tracking-wide flex items-center gap-2"
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
                    className="px-6 py-2.5 rounded-full chrome-button text-xs font-semibold tracking-wide flex items-center gap-2"
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
