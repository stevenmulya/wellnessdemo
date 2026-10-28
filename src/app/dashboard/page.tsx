import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getWellnessSession } from "@/wellness/security/session";
import { prisma } from "@/wellness/db";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { safeJsonParse } from "@/wellness/utils/json";
import { getProgramDayWibWindow } from "@/wellness/utils/timezone";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getWellnessSession();
  if (!session) {
    redirect("/?auth=signin&target=dashboard");
  }

  // 1. User profile directly available from validated session (Zero duplicate SQL query!)
  const user = {
    id: session.userId,
    email: session.email,
    fullName: session.fullName,
    phone: session.phone,
    role: session.role,
    status: session.status,
    createdAt: session.createdAt,
  };

  // 2. Fetch user's enrollments and all published programs concurrently
  const [enrollments, allProgramsData] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId: session.userId },
      include: {
        program: {
          include: {
            _count: { select: { days: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.program.findMany({
      where: {
        status: { in: ["ACTIVE", "COMING_SOON"] },
      },
      include: {
        _count: {
          select: {
            enrollments: { where: { status: "ACTIVE" } },
          },
        },
        days: {
          include: {
            progress: {
              where: { userId: session.userId },
            },
          },
          orderBy: { dayNumber: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const userActiveProgramIds = new Set(
    enrollments.filter((e) => e.status === "ACTIVE").map((e) => e.program.id)
  );

  const myPrograms = enrollments.map((e) => ({
    enrollmentId: e.id,
    programId: e.program.id,
    title: e.program.title,
    slug: e.program.slug,
    description: e.program.description,
    coachName: e.program.coachName,
    price: e.program.price,
    maxQuota: e.program.maxQuota,
    locationType: e.program.locationType,
    city: e.program.city,
    venueAddress: e.program.venueAddress,
    virtualFallbackAvailable: e.program.virtualFallbackAvailable,
    communityLink: e.program.communityLink,
    dayCount: e.program._count.days,
    startDate: e.program.startDate,
    endDate: e.program.endDate,
    registrationDeadline: e.program.registrationDeadline,
    status: e.status,
    attendanceMode: e.attendanceMode,
    paymentReference: e.paymentReference,
    invoiceExpiresAt: e.invoiceExpiresAt,
    paidAt: e.paidAt,
    validUntil: e.validUntil,
  }));

  const now = new Date();

  const allPrograms = allProgramsData.map((p) => {
    const isPaidMember = userActiveProgramIds.has(p.id);

    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      description: p.description,
      recommendedFor: p.recommendedFor,
      coachName: p.coachName,
      durationDays: p.durationDays,
      price: p.price,
      maxQuota: p.maxQuota,
      locationType: p.locationType,
      city: p.city,
      venueAddress: p.venueAddress,
      virtualFallbackAvailable: p.virtualFallbackAvailable,
      enrolledCount: p._count.enrollments,
      communityLink: p.communityLink,
      status: p.status || (p.isPublished ? "ACTIVE" : "COMING_SOON"),
      startDate: p.startDate,
      endDate: p.endDate,
      registrationOpenDate: p.registrationOpenDate,
      registrationDeadline: p.registrationDeadline,
      dayCount: p.days.length,
      days: p.days.map((d) => {
        // SOW 5.3 Strict Calendar Drip Content normalized to Western Indonesia Time (WIB / UTC+7):
        // Day N unlocks at 00:00 WIB on batchStart + (dayNumber - 1) days
        const { unlockDate, deadline2359, isCalendarUnlocked, isPast2359 } =
          getProgramDayWibWindow(p.startDate, d.dayNumber, now);

        const progRecord = d.progress[0] || null;
        const checklistItems: string[] = safeJsonParse<string[]>(d.videoChecklist, []);
        const completedChecklist: string[] = safeJsonParse<string[]>(progRecord?.checklistCompleted, []);

        const videoDone =
          d.dayType !== "TRAINING_DAY" || !d.videoUrl
            ? true
            : !!progRecord?.videoWatched || !!progRecord?.isCompleted;
        const checklistDone =
          checklistItems.length === 0
            ? true
            : checklistItems.every((item) => completedChecklist.includes(item)) ||
              !!progRecord?.isCompleted;

        const isFullyCompleted =
          !!progRecord?.isCompleted ||
          (videoDone && checklistDone && (checklistItems.length === 0 || completedChecklist.length > 0));

        // SOW 5.3 Skip Day Logic:
        // Automatically recorded as "Skipped Day" if user has not completed both workout video & daily assessment checklist by 23:59 on that day
        const isSkipped = isPast2359 && !isFullyCompleted;

        // SOW 5.7 Content & Video Protection:
        // Restrict media URLs strictly to verified paying members on unlocked calendar days
        const canAccessMedia = isPaidMember && isCalendarUnlocked;

        return {
          id: d.id,
          dayNumber: d.dayNumber,
          title: d.title,
          dayType: d.dayType,
          workoutOptions: safeJsonParse<string[]>(d.workoutOptions, [
            "Hot Pilates",
            "Strength Workout",
            "Outdoor Running",
            "Yoga & Mobility Flow",
            "Cardio / HIIT",
          ]),
          sleepRecommendation: d.sleepRecommendation || "Target 8 Hours • Wind down before 22:30 WIB",
          dayNotifications: safeJsonParse<Array<{ time: string; message: string; label?: string }>>(d.dayNotifications, []),
          unlockDate: unlockDate.toISOString(),
          isCalendarUnlocked,
          isPast2359,
          isSkipped,
          videoUrl: canAccessMedia ? d.videoUrl : null,
          videoChecklist: checklistItems,
          mealRecommendation: canAccessMedia ? d.mealRecommendation : null,
          dailyAssessment: d.dailyAssessment,
          pendingReminder: d.pendingReminder,
          completedReminder: d.completedReminder,
          meetupLink: canAccessMedia ? d.meetupLink : null,
          mapLink: d.mapLink,
          eventTitle: d.eventTitle,
          eventHost: d.eventHost,
          eventDetails: d.eventDetails,
          onsiteVenue: d.onsiteVenue,
          onsiteSchedule: d.onsiteSchedule,
          restInstructions: d.restInstructions,
          coachName: d.coachName,
          recommendedFor: d.recommendedFor,
          userProgress: progRecord
            ? {
                id: progRecord.id,
                videoWatched: progRecord.videoWatched,
                isCompleted: isFullyCompleted,
                checklistCompleted: progRecord.checklistCompleted,
                selectedWorkout: progRecord.selectedWorkout,
                photoBeforeUrl: progRecord.photoBeforeUrl,
                photoAfterUrl: progRecord.photoAfterUrl,
                workoutNotes: progRecord.workoutNotes,
                eventFeedback: progRecord.eventFeedback,
                mealCompliance: progRecord.mealCompliance,
                mealNotes: progRecord.mealNotes,
                dailyReflection: progRecord.dailyReflection,
                happinessRate: progRecord.happinessRate,
                bedtime: progRecord.bedtime,
                wakeTime: progRecord.wakeTime,
                sleepDurationMinutes: progRecord.sleepDurationMinutes,
                assessmentResponse: progRecord.assessmentResponse,
              }
            : null,
        };
      }),
    };
  });

  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <DashboardClient
        user={user}
        myPrograms={myPrograms}
        allPrograms={allPrograms}
      />
    </Suspense>
  );
}
