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
import { getProgramDayWibWindow } from "../utils/timezone";

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
    recommendedFor,
    coachName,
    durationDays,
    price,
    maxQuota,
    communityLink,
    locationType,
    city,
    venueAddress,
    virtualFallbackAvailable,
    startDate,
    endDate,
    registrationDeadline,
    days,
  } = validation.data;

  // Generate unique slug
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const slug = `${baseSlug}-${randomSuffix}`;

  const newProgram = await prisma.program.create({
    data: {
      title,
      slug,
      description,
      recommendedFor: recommendedFor || "All Levels • Mindful Movement & Longevity",
      coachName,
      durationDays: durationDays || 21,
      price,
      maxQuota: maxQuota || 50,
      communityLink: communityLink || null,
      locationType: locationType || "ONLINE",
      city: city?.trim() || null,
      venueAddress: venueAddress?.trim() || null,
      virtualFallbackAvailable: virtualFallbackAvailable ?? true,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      registrationDeadline: new Date(registrationDeadline),
      isPublished: false, // Always enters DRAFT first until all days are populated & launched
      days:
        days && days.length > 0
          ? {
              create: days.map((d) => ({
                dayNumber: d.dayNumber,
                title: d.title,
                dayType: d.dayType,
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
    })
  ) {
    const hint =
      d.dayType === "TRAINING_DAY"
        ? "Workout Day requires a title and at least a Video URL or 1 Checklist item."
        : d.dayType === "REST_DAY"
        ? "Rest Day requires a title and Rest Day Instructions."
        : "On-Site Day requires a title and Venue Location or Session Schedule.";
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
      onsiteVenue: d.onsiteVenue?.trim() || null,
      onsiteSchedule: d.onsiteSchedule?.trim() || null,
      restInstructions: d.restInstructions?.trim() || null,
      coachName: d.dayType === "REST_DAY" ? null : (d.coachName?.trim() || null),
      recommendedFor: d.dayType === "REST_DAY" ? null : (d.recommendedFor?.trim() || null),
    },
    update: {
      title: d.title.trim(),
      dayType: d.dayType,
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
      onsiteVenue: d.onsiteVenue?.trim() || null,
      onsiteSchedule: d.onsiteSchedule?.trim() || null,
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
      videoChecklist: safeJsonParse<string[]>(savedDay.videoChecklist, []),
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

  // Check if all target 1..durationDays are still complete
  let allDaysReady = true;
  for (let dNum = 1; dNum <= input.durationDays; dNum++) {
    const dayObj = existingProgram.days.find((d) => d.dayNumber === dNum);
    if (!isProgramDayComplete(dayObj)) {
      allDaysReady = false;
      break;
    }
  }

  const nextIsPublished = existingProgram.isPublished && allDaysReady;

  const updated = await prisma.program.update({
    where: { id: input.programId },
    data: {
      title: input.title.trim(),
      description: input.description.trim(),
      recommendedFor: input.recommendedFor.trim(),
      coachName: input.coachName.trim(),
      durationDays: input.durationDays,
      maxQuota: Math.max(1, Number(input.maxQuota) || 50),
      price: Math.max(0, Number(input.price) || 0),
      communityLink: input.communityLink?.trim() || null,
      locationType: input.locationType || "ONLINE",
      city: input.city?.trim() || null,
      venueAddress: input.venueAddress?.trim() || null,
      virtualFallbackAvailable: input.virtualFallbackAvailable ?? true,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      registrationDeadline: new Date(input.registrationDeadline),
      isPublished: nextIsPublished,
    },
  });

  return {
    success: true,
    message: `Base info updated for "${updated.title}".`,
    data: updated,
  };
}

/**
 * Superadmin: Submit Final & Launch Program (`isPublished: true`) or revert to Draft (`isPublished: false`).
 * Strictly verifies that every day from Day 1 to Day `durationDays` is filled before allowing launch!
 */
export async function wellnessAdminTogglePublishProgram(
  programId: string,
  publish: boolean
): Promise<WellnessActionResult<{ isPublished: boolean }>> {
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

  if (publish) {
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
        message: `Cannot launch yet! All ${program.durationDays} days must be filled first. Incomplete: ${previewMissing}.`,
      };
    }
  }

  const updated = await prisma.program.update({
    where: { id: programId },
    data: { isPublished: publish },
  });

  return {
    success: true,
    message: publish
      ? `🎉 "${updated.title}" is now LIVE and open for member enrollment!`
      : `"${updated.title}" has been moved back to Draft mode.`,
    data: { isPublished: updated.isPublished },
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

  // Check existing progress to preserve videoWatched if not explicitly passed
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

  // Enforce Training Day completion rules (video + all checklist items)
  let verifiedCompleted = isCompleted;
  if (isCompleted && programDay.dayType === "TRAINING_DAY") {
    const requiredTasks: string[] = safeJsonParse<string[]>(programDay.videoChecklist, []);
    const hasVideoRequirement = !!programDay.videoUrl && programDay.videoUrl.trim().length > 0;
    const allTasksChecked =
      requiredTasks.length === 0 ||
      requiredTasks.every((t) => checklistCompleted.includes(t));

    if ((hasVideoRequirement && !nextVideoWatched) || !allTasksChecked) {
      verifiedCompleted = false;
    }
  }

  const progress = existingProgress
    ? await prisma.dayProgress.update({
        where: { id: existingProgress.id },
        data: {
          videoWatched: nextVideoWatched,
          isCompleted: verifiedCompleted,
          checklistCompleted: JSON.stringify(checklistCompleted),
          assessmentResponse: assessmentResponse || null,
          completedAt: verifiedCompleted ? new Date() : null,
        },
      })
    : await prisma.dayProgress.create({
        data: {
          userId: session.userId,
          programDayId,
          videoWatched: nextVideoWatched,
          isCompleted: verifiedCompleted,
          checklistCompleted: JSON.stringify(checklistCompleted),
          assessmentResponse: assessmentResponse || null,
          completedAt: verifiedCompleted ? new Date() : null,
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
