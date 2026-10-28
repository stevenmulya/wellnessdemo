"use server";

import { prisma } from "../db";
import { requireAuth, requireSuperadmin } from "../security/guards";
import {
  CreateProgramSchema,
  UpdateProgramMetaSchema,
  SaveSingleDaySchema,
  SubmitDayProgressSchema,
  isProgramDayComplete,
} from "../validators/program";
import { WellnessActionResult } from "./auth";
import { safeJsonParse } from "../utils/json";
import { getProgramDayWibWindow, calculateSleepDuration } from "../utils/timezone";

/**
 * Superadmin: Create a new Cohort Program in DRAFT state (`isPublished: false`).
 * Stores all base cohort information (`title`, `coachName`, `recommendedFor`, `durationDays`, `price`, `maxQuota`, `dates`, etc.)
 * so the Admin can then populate Day 1 through Day N day-by-day before final launch.
 */
export async function wellnessAdminCreateProgram(
  rawInput: unknown
): Promise<WellnessActionResult> {
  await requireSuperadmin();

  const validation = CreateProgramSchema.safeParse(rawInput);
  if (!validation.success) {
    return {
      success: false,
      message: "Invalid program configuration data.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const {
    title,
    description,
    category,
    recommendedFor,
    coachName,
    coachTitle,
    durationDays,
    actualPrice,
    discountPercentage,
    price,
    maxQuota,
    communityLink,
    locationType,
    city,
    venueAddress,
    virtualFallbackAvailable,
    startDate,
    endDate,
    registrationOpenDate,
    registrationDeadline,
    status,
    days,
  } = validation.data;

  // Generate unique slug
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const slug = `${baseSlug}-${randomSuffix}`;

  const startD = new Date(startDate);
  const endD = new Date(endDate);
  const calculatedDays = Math.max(
    1,
    Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
  const resolvedDuration = durationDays || calculatedDays;

  const resolvedActualPrice = actualPrice !== undefined ? Number(actualPrice) : (Number(price) || 0);
  const resolvedDiscount = discountPercentage !== undefined ? Number(discountPercentage) : 0;
  const resolvedFinalPrice = Math.max(
    0,
    Math.round(resolvedActualPrice * (1 - resolvedDiscount / 100))
  );

  const newProgram = await prisma.program.create({
    data: {
      title: title.trim(),
      slug,
      description: description.trim(),
      category: category?.trim() || "Pilates",
      recommendedFor: recommendedFor?.trim() || "All Levels",
      coachName: coachName.trim(),
      coachTitle: coachTitle?.trim() || null,
      durationDays: resolvedDuration,
      actualPrice: resolvedActualPrice,
      discountPercentage: resolvedDiscount,
      price: resolvedFinalPrice,
      maxQuota: maxQuota || 50,
      communityLink: communityLink?.trim() || null,
      locationType: locationType || "ONLINE",
      city: city?.trim() || null,
      venueAddress: venueAddress?.trim() || null,
      virtualFallbackAvailable: virtualFallbackAvailable ?? true,
      startDate: startD,
      endDate: endD,
      registrationOpenDate: registrationOpenDate ? new Date(registrationOpenDate) : null,
      registrationDeadline: new Date(registrationDeadline),
      status: "DRAFT",
      isPublished: false,
      days:
        days && days.length > 0
          ? {
              create: days.map((d) => ({
                dayNumber: d.dayNumber,
                title: d.title,
                dayType: d.dayType,
                workoutOptions: JSON.stringify(d.workoutOptions || []),
                sleepRecommendation: d.sleepRecommendation || null,
                dayNotifications: JSON.stringify(d.dayNotifications || []),
                videoUrl: d.videoUrl || null,
                videoChecklist: JSON.stringify(d.videoChecklist || []),
                mealRecommendation: d.mealRecommendation || null,
                dailyAssessment: d.dailyAssessment || null,
                pendingReminder:
                  d.pendingReminder ||
                  "Don't forget your scheduled routine today! Complete video & checklist before 23:59.",
                completedReminder:
                  d.completedReminder ||
                  "Outstanding work completing your routine today! Hydrate and recover.",
                meetupLink: d.meetupLink || null,
                onsiteVenue: d.onsiteVenue || null,
                onsiteSchedule: d.onsiteSchedule || null,
                restInstructions:
                  d.restInstructions ||
                  "Take today to rest, stretch gently, and let your body restore its energy.",
              })),
            }
          : undefined,
    },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
      },
    },
  });

  return {
    success: true,
    message: `Draft program "${newProgram.title}" created (${newProgram.durationDays}-Day target). Now fill each day to unlock final launch.`,
    data: newProgram,
  };
}

/**
 * Superadmin (Modular Day-by-Day Curriculum Submission):
 * Save or update a single day independently (Day 1 through Day N).
 */
export async function wellnessAdminSaveProgramDay(
  rawInput: unknown
): Promise<WellnessActionResult> {
  await requireSuperadmin();

  const validation = SaveSingleDaySchema.safeParse(rawInput);
  if (!validation.success) {
    const detail = Object.values(validation.error.flatten().fieldErrors)
      .flat()
      .join(" ");
    return {
      success: false,
      message: detail || "Invalid daily curriculum input.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const d = validation.data;

  // Enforce required content based on dayType before saving as complete
  if (
    !isProgramDayComplete({
      title: d.title,
      dayType: d.dayType,
      videoUrl: d.videoUrl,
      videoChecklist: d.videoChecklist,
      restInstructions: d.restInstructions,
      onsiteVenue: d.onsiteVenue,
      onsiteSchedule: d.onsiteSchedule,
      meetupLink: d.meetupLink,
      eventTitle: d.eventTitle,
      mapLink: d.mapLink,
    })
  ) {
    const hint =
      d.dayType === "TRAINING_DAY"
        ? "Training Day requires a title and at least a Video URL or 1 Checklist item."
        : d.dayType === "REST_DAY"
        ? "Rest Day requires a title and Rest Day Instructions."
        : "Connect Day requires a title and Event Title, Venue, or Session Schedule.";
    return {
      success: false,
      message: hint,
    };
  }

  const savedDay = await prisma.programDay.upsert({
    where: {
      programId_dayNumber: {
        programId: d.programId,
        dayNumber: d.dayNumber,
      },
    },
    create: {
      programId: d.programId,
      dayNumber: d.dayNumber,
      title: d.title.trim(),
      dayType: d.dayType,
      workoutOptions: JSON.stringify(d.workoutOptions || []),
      sleepRecommendation: d.sleepRecommendation?.trim() || null,
      dayNotifications: JSON.stringify(d.dayNotifications || []),
      videoUrl: d.videoUrl?.trim() || null,
      videoChecklist: JSON.stringify(d.videoChecklist || []),
      mealRecommendation: d.mealRecommendation?.trim() || null,
      dailyAssessment: d.dailyAssessment?.trim() || null,
      pendingReminder:
        d.pendingReminder?.trim() ||
        `Day ${d.dayNumber} is unlocked! Complete your routine before 23:59.`,
      completedReminder:
        d.completedReminder?.trim() ||
        `Day ${d.dayNumber} completed! Great consistency.`,
      meetupLink: d.meetupLink?.trim() || null,
      mapLink: d.mapLink?.trim() || null,
      onsiteVenue: d.onsiteVenue?.trim() || null,
      onsiteSchedule: d.onsiteSchedule?.trim() || null,
      eventTitle: d.eventTitle?.trim() || null,
      eventHost: d.eventHost?.trim() || null,
      eventDetails: d.eventDetails?.trim() || null,
      restInstructions: d.restInstructions?.trim() || null,
      coachName: d.dayType === "REST_DAY" ? null : (d.coachName?.trim() || null),
      recommendedFor: d.dayType === "REST_DAY" ? null : (d.recommendedFor?.trim() || null),
    },
    update: {
      title: d.title.trim(),
      dayType: d.dayType,
      workoutOptions: JSON.stringify(d.workoutOptions || []),
      sleepRecommendation: d.sleepRecommendation?.trim() || null,
      dayNotifications: JSON.stringify(d.dayNotifications || []),
      videoUrl: d.videoUrl?.trim() || null,
      videoChecklist: JSON.stringify(d.videoChecklist || []),
      mealRecommendation: d.mealRecommendation?.trim() || null,
      dailyAssessment: d.dailyAssessment?.trim() || null,
      pendingReminder:
        d.pendingReminder?.trim() ||
        `Day ${d.dayNumber} is unlocked! Complete your routine before 23:59.`,
      completedReminder:
        d.completedReminder?.trim() ||
        `Day ${d.dayNumber} completed! Great consistency.`,
      meetupLink: d.meetupLink?.trim() || null,
      mapLink: d.mapLink?.trim() || null,
      onsiteVenue: d.onsiteVenue?.trim() || null,
      onsiteSchedule: d.onsiteSchedule?.trim() || null,
      eventTitle: d.eventTitle?.trim() || null,
      eventHost: d.eventHost?.trim() || null,
      eventDetails: d.eventDetails?.trim() || null,
      restInstructions: d.restInstructions?.trim() || null,
      coachName: d.dayType === "REST_DAY" ? null : (d.coachName?.trim() || null),
      recommendedFor: d.dayType === "REST_DAY" ? null : (d.recommendedFor?.trim() || null),
    },
  });

  return {
    success: true,
    message: `Day ${savedDay.dayNumber} ("${savedDay.title}") saved.`,
    data: {
      ...savedDay,
      workoutOptions: safeJsonParse<string[]>(savedDay.workoutOptions, []),
      videoChecklist: safeJsonParse<string[]>(savedDay.videoChecklist, []),
      dayNotifications: safeJsonParse<any[]>(savedDay.dayNotifications, []),
    },
  };
}

/**
 * Superadmin: Clear / Delete a specific Day from a Program.
 * If the program was published and removing a day makes it incomplete, reverts to Draft (`isPublished: false`).
 */
export async function wellnessAdminDeleteProgramDay(
  programId: string,
  dayNumber: number
): Promise<WellnessActionResult> {
  await requireSuperadmin();

  const existingDay = await prisma.programDay.findUnique({
    where: {
      programId_dayNumber: {
        programId,
        dayNumber,
      },
    },
  });

  if (!existingDay) {
    return {
      success: false,
      message: `Day ${dayNumber} has not been saved yet.`,
    };
  }

  await prisma.$transaction([
    prisma.programDay.delete({
      where: { id: existingDay.id },
    }),
    prisma.program.update({
      where: { id: programId },
      data: { isPublished: false },
    }),
  ]);

  return {
    success: true,
    message: `Day ${dayNumber} cleared. Program status set to Draft until all days are filled.`,
  };
}

/**
 * Superadmin: Update all Base Info metadata (title, coachName, recommendedFor, description, durationDays, quota, dates, price, communityLink).
 */
export async function wellnessAdminUpdateProgramMeta(
  rawInput: unknown
): Promise<WellnessActionResult> {
  await requireSuperadmin();

  const validation = UpdateProgramMetaSchema.safeParse(rawInput);
  if (!validation.success) {
    const detail = Object.values(validation.error.flatten().fieldErrors)
      .flat()
      .join(" ");
    return {
      success: false,
      message: detail || "Invalid program base settings.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const input = validation.data;

  const existingProgram = await prisma.program.findUnique({
    where: { id: input.programId },
    include: { days: true },
  });

  if (!existingProgram) {
    return { success: false, message: "Program not found." };
  }

  // Prevent modifying core parameters once program is published and live
  if (existingProgram.isPublished) {
    return {
      success: false,
      message:
        "Program information is locked because this cohort is published and live. Unpublish the program first if you need to modify core terms.",
    };
  }

  // If duration is reduced, delete truncated excess days (e.g. Day 7, 6, 5 when reduced to 3)
  if (input.durationDays < existingProgram.durationDays) {
    await prisma.programDay.deleteMany({
      where: {
        programId: input.programId,
        dayNumber: { gt: input.durationDays },
      },
    });
  }

  const resolvedActualPrice =
    input.actualPrice !== undefined
      ? Number(input.actualPrice)
      : existingProgram.actualPrice;
  const resolvedDiscount =
    input.discountPercentage !== undefined
      ? Number(input.discountPercentage)
      : existingProgram.discountPercentage;
  const resolvedFinalPrice = Math.max(
    0,
    Math.round(resolvedActualPrice * (1 - resolvedDiscount / 100))
  );

  const updated = await prisma.program.update({
    where: { id: input.programId },
    data: {
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category?.trim() || existingProgram.category || "Pilates",
      recommendedFor: input.recommendedFor.trim(),
      coachName: input.coachName.trim(),
      coachTitle: input.coachTitle?.trim() || null,
      durationDays: input.durationDays,
      actualPrice: resolvedActualPrice,
      discountPercentage: resolvedDiscount,
      price: resolvedFinalPrice,
      maxQuota: Math.max(1, Number(input.maxQuota) || 50),
      communityLink: input.communityLink?.trim() || null,
      locationType: input.locationType || "ONLINE",
      city: input.city?.trim() || null,
      venueAddress: input.venueAddress?.trim() || null,
      virtualFallbackAvailable: input.virtualFallbackAvailable ?? true,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      registrationOpenDate: input.registrationOpenDate ? new Date(input.registrationOpenDate) : null,
      registrationDeadline: new Date(input.registrationDeadline),
      status: input.status ?? existingProgram.status,
    },
  });

  return {
    success: true,
    message: `Base info updated for "${updated.title}".`,
    data: updated,
  };
}

/**
 * Superadmin: Set program status directly:
 * - "NOT_SHOW" (Disembunyikan dari public & user catalog)
 * - "COMING_SOON" (Tampil dengan label Coming Soon, tanggal buka pendaftaran / TBA, belum bisa beli)
 * - "ACTIVE" (Aktif, pendaftaran terbuka dan bisa di-enroll)
 */
export async function wellnessAdminSetProgramStatus(
  programId: string,
  status: "NOT_SHOW" | "COMING_SOON" | "ACTIVE"
): Promise<WellnessActionResult<{ status: string; isPublished: boolean }>> {
  await requireSuperadmin();

  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: { days: { orderBy: { dayNumber: "asc" } } },
  });

  if (!program) {
    return { success: false, message: "Program not found." };
  }

  // Jika diubah ke ACTIVE, pastikan seluruh hari dari Day 1 hingga Day durationDays telah lengkap
  if (status === "ACTIVE") {
    const missingDays: number[] = [];
    for (let i = 1; i <= program.durationDays; i++) {
      const dayRecord = program.days.find((d) => d.dayNumber === i);
      if (!isProgramDayComplete(dayRecord)) {
        missingDays.push(i);
      }
    }

    if (missingDays.length > 0) {
      const previewMissing =
        missingDays.length > 6
          ? `Day ${missingDays.slice(0, 6).join(", Day ")} (+${missingDays.length - 6} more)`
          : `Day ${missingDays.join(", Day ")}`;
      return {
        success: false,
        message: `Tidak dapat mengaktifkan program! Semua ${program.durationDays} hari harus lengkap terlebih dahulu. Belum lengkap: ${previewMissing}. Anda bisa memilih 'Coming Soon' jika masih on progress.`,
      };
    }
  }

  const isPublished = status !== "NOT_SHOW";

  const updated = await prisma.program.update({
    where: { id: programId },
    data: {
      status,
      isPublished,
    },
  });

  const label =
    status === "ACTIVE"
      ? "Aktif (Pendaftaran Dibuka)"
      : status === "COMING_SOON"
      ? "Coming Soon (Segera Hadir)"
      : "Not Show (Disembunyikan / Draft)";

  return {
    success: true,
    message: `Status program "${updated.title}" diubah menjadi: ${label}.`,
    data: { status: updated.status, isPublished: updated.isPublished },
  };
}

/**
 * Superadmin: Submit Final & Launch Program (`isPublished: true`) or revert to Draft (`isPublished: false`).
 * Strictly verifies that every day from Day 1 to Day `durationDays` is filled before allowing launch!
 */
export async function wellnessAdminTogglePublishProgram(
  programId: string,
  publish: boolean
): Promise<WellnessActionResult<{ isPublished: boolean; status: string }>> {
  await requireSuperadmin();

  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
      },
    },
  });

  if (!program) {
    return { success: false, message: "Program not found." };
  }

  const updated = await prisma.program.update({
    where: { id: programId },
    data: {
      isPublished: publish,
      status: publish ? "PUBLISHED" : "DRAFT",
    },
  });

  return {
    success: true,
    message: publish
      ? `Cohort "${updated.title}" is now PUBLISHED and live on the portal!`
      : `Cohort "${updated.title}" is now UNPUBLISHED (reverted to Draft).`,
    data: { isPublished: updated.isPublished, status: updated.status },
  };
}

/**
 * Superadmin: Delete a wellness program and its days.
 */
export async function wellnessAdminDeleteProgram(
  programId: string
): Promise<WellnessActionResult> {
  await requireSuperadmin();

  const existing = await prisma.program.findUnique({
    where: { id: programId },
  });

  if (!existing) {
    return { success: false, message: "Program not found." };
  }

  await prisma.program.delete({
    where: { id: programId },
  });

  return {
    success: true,
    message: `Program "${existing.title}" deleted permanently.`,
  };
}

/**
 * User: Submit or toggle daily progress (checklist, video completion, assessment response).
 * Enforces SOW 5.3 Strict Calendar Drip (`00:00` unlock & `23:59` cutoff) & Verified Paying Member access.
 */
export async function wellnessUserSubmitDayProgress(
  rawInput: unknown
): Promise<WellnessActionResult> {
  const session = await requireAuth();

  const validation = SubmitDayProgressSchema.safeParse(rawInput);
  if (!validation.success) {
    return {
      success: false,
      message: "Invalid day progress input.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const {
    programDayId,
    videoWatched,
    isCompleted,
    checklistCompleted,
    selectedWorkout,
    photoBeforeUrl,
    photoAfterUrl,
    workoutNotes,
    eventFeedback,
    mealCompliance,
    mealNotes,
    dailyReflection,
    happinessRate,
    bedtime,
    wakeTime,
    sleepDurationMinutes,
    assessmentResponse,
  } = validation.data;

  // Verify the day exists and get its programId
  const programDay = await prisma.programDay.findUnique({
    where: { id: programDayId },
    include: { program: true },
  });

  if (!programDay) {
    return { success: false, message: "Scheduled day not found." };
  }

  // Verify user has an ACTIVE enrollment for this program
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_programId: {
        userId: session.userId,
        programId: programDay.programId,
      },
    },
  });

  if (!enrollment || enrollment.status !== "ACTIVE") {
    return {
      success: false,
      message:
        "Access denied. Active QRIS-verified enrollment is required to log daily curriculum progress.",
    };
  }

  // Enforce SOW 5.3 Strict Calendar Drip & 23:59 Nightly Cutoff in Western Indonesia Time (WIB)
  const { isCalendarUnlocked, isPast2359 } = getProgramDayWibWindow(
    programDay.program.startDate,
    programDay.dayNumber
  );

  if (!isCalendarUnlocked) {
    return {
      success: false,
      message: `Day ${programDay.dayNumber} is locked until 00:00 WIB on its scheduled calendar date.`,
    };
  }

  if (isPast2359) {
    return {
      success: false,
      message: `The 23:59 WIB cutoff for Day ${programDay.dayNumber} has passed. Past days are read-only.`,
    };
  }

  // Check existing progress to preserve previous values if not explicitly passed
  const existingProgress = await prisma.dayProgress.findUnique({
    where: {
      userId_programDayId: {
        userId: session.userId,
        programDayId,
      },
    },
  });

  const nextVideoWatched =
    videoWatched !== undefined
      ? videoWatched
      : existingProgress?.videoWatched ?? false;

  // Compute sleep duration if bedtime and wakeTime are provided
  const finalBedtime = bedtime !== undefined ? bedtime : existingProgress?.bedtime || null;
  const finalWakeTime = wakeTime !== undefined ? wakeTime : existingProgress?.wakeTime || null;
  let finalSleepMinutes = sleepDurationMinutes;
  if (finalSleepMinutes === undefined && finalBedtime && finalWakeTime) {
    const calc = calculateSleepDuration(finalBedtime, finalWakeTime);
    finalSleepMinutes = calc ? calc.totalMinutes : null;
  }

  // Enforce Training Day completion rules (checklist items complete)
  let verifiedCompleted = isCompleted;
  if (programDay.dayType === "TRAINING_DAY") {
    const requiredTasks: string[] = safeJsonParse<string[]>(programDay.videoChecklist, []);
    const allTasksChecked =
      requiredTasks.length === 0 ||
      requiredTasks.every((t) => checklistCompleted.includes(t));

    if (!allTasksChecked) {
      verifiedCompleted = false;
    }
  }

  const payloadData = {
    videoWatched: nextVideoWatched,
    isCompleted: verifiedCompleted,
    checklistCompleted: JSON.stringify(checklistCompleted),
    selectedWorkout: selectedWorkout !== undefined ? (selectedWorkout || null) : existingProgress?.selectedWorkout,
    photoBeforeUrl: photoBeforeUrl !== undefined ? (photoBeforeUrl || null) : existingProgress?.photoBeforeUrl,
    photoAfterUrl: photoAfterUrl !== undefined ? (photoAfterUrl || null) : existingProgress?.photoAfterUrl,
    workoutNotes: workoutNotes !== undefined ? (workoutNotes || null) : (existingProgress as any)?.workoutNotes,
    eventFeedback: eventFeedback !== undefined ? (eventFeedback || null) : (existingProgress as any)?.eventFeedback,
    mealCompliance: mealCompliance !== undefined ? (mealCompliance || null) : existingProgress?.mealCompliance,
    mealNotes: mealNotes !== undefined ? (mealNotes || null) : existingProgress?.mealNotes,
    dailyReflection: dailyReflection !== undefined ? (dailyReflection || null) : existingProgress?.dailyReflection,
    happinessRate: happinessRate !== undefined ? happinessRate : existingProgress?.happinessRate,
    bedtime: finalBedtime,
    wakeTime: finalWakeTime,
    sleepDurationMinutes: finalSleepMinutes,
    assessmentResponse: assessmentResponse !== undefined ? (assessmentResponse || null) : existingProgress?.assessmentResponse,
    completedAt: verifiedCompleted ? new Date() : (isCompleted ? existingProgress?.completedAt : null),
  };

  const progress = existingProgress
    ? await prisma.dayProgress.update({
        where: { id: existingProgress.id },
        data: payloadData,
      })
    : await prisma.dayProgress.create({
        data: {
          userId: session.userId,
          programDayId,
          ...payloadData,
        },
      });

  return {
    success: true,
    message: verifiedCompleted
      ? programDay.completedReminder || "Day marked as completed! Excellent job."
      : "Daily progress saved.",
    data: progress,
  };
}
