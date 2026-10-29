import { z } from "zod";

export const DayNotificationInputSchema = z.object({
  time: z.string().min(1, "Waktu notifikasi wajib diisi"), // e.g. "07:00"
  message: z.string().min(1, "Pesan notifikasi wajib diisi"),
  label: z.string().optional().or(z.literal("")),
});

export const ProgramDayInputSchema = z.object({
  dayNumber: z.number().int().positive(),
  title: z.string().min(2, "Day title is required (min. 2 characters)").max(120),
  dayType: z.enum(["TRAINING_DAY", "REST_DAY", "CONNECTION_DAY", "MEETUP_DAY"]),
  workoutOptions: z.array(z.string()).optional().default([]),
  sleepRecommendation: z.string().optional().or(z.literal("")),
  dayNotifications: z.array(DayNotificationInputSchema).optional().default([]),
  videoUrl: z.string().optional().or(z.literal("")),
  videoChecklist: z.array(z.string()).default([]),
  mealRecommendation: z.string().optional().or(z.literal("")),
  dailyAssessment: z.string().optional().or(z.literal("")),
  pendingReminder: z.string().optional().or(z.literal("")),
  completedReminder: z.string().optional().or(z.literal("")),
  meetupLink: z.string().optional().or(z.literal("")),
  mapLink: z.string().optional().or(z.literal("")),
  onsiteVenue: z.string().optional().or(z.literal("")),
  onsiteSchedule: z.string().optional().or(z.literal("")),
  eventTitle: z.string().optional().or(z.literal("")),
  eventHost: z.string().optional().or(z.literal("")),
  eventDetails: z.string().optional().or(z.literal("")),
  restInstructions: z.string().optional().or(z.literal("")),
  coachName: z.string().optional().or(z.literal("")),
  recommendedFor: z.string().optional().or(z.literal("")),
});

export const SaveSingleDaySchema = ProgramDayInputSchema.extend({
  programId: z.string().min(1, "Program ID is required"),
});

export const CreateProgramSchema = z
  .object({
    title: z.string().min(3, "Program title must be at least 3 characters").max(120),
    description: z.string().min(10, "Program description must be at least 10 characters"),
    coverImage: z.string().optional().or(z.literal("")),
    difficultyLevel: z
      .enum(["BEGINNER", "MODERATE", "INTERMEDIATE", "ADVANCED", "HIGH_INTENSITY"])
      .default("INTERMEDIATE"),
    category: z.string().default("Pilates"),
    equipment: z.string().optional().or(z.literal("")),
    dailyCommitment: z.string().optional().or(z.literal("")),
    recommendedFor: z
      .string()
      .min(2, "Recommended audience is required")
      .max(400)
      .default("All Levels"),
    coachName: z.string().min(2, "Coach name is required").max(300),
    coachTitle: z.string().optional().or(z.literal("")),
    durationDays: z
      .number()
      .int()
      .min(1, "Program must be at least 1 day")
      .max(90, "Program cannot exceed 90 days")
      .default(21),
    actualPrice: z.number().min(0, "Actual price must be 0 or higher").default(0),
    discountPercentage: z.number().int().min(0).max(100).default(0),
    price: z.number().min(0, "Price must be 0 or higher"),
    maxQuota: z.number().int().min(1, "Quota must be at least 1 participant").default(50),
    communityLink: z.string().optional().or(z.literal("")),
    locationType: z.enum(["ONLINE", "ONSITE", "HYBRID"]).default("ONLINE"),
    city: z.string().optional().or(z.literal("")),
    venueAddress: z.string().optional().or(z.literal("")),
    virtualFallbackAvailable: z.boolean().default(true),
    startDate: z.union([z.string(), z.date()]),
    endDate: z.union([z.string(), z.date()]),
    registrationOpenDate: z.union([z.string(), z.date()]).optional().nullable(),
    registrationDeadline: z.union([z.string(), z.date()]),
    status: z.enum(["DRAFT", "PUBLISHED", "NOT_SHOW", "COMING_SOON", "ACTIVE"]).default("DRAFT"),
    isPublished: z.boolean().default(false),
    days: z.array(ProgramDayInputSchema).optional().default([]),
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

export const UpdateProgramMetaSchema = z
  .object({
    programId: z.string().min(1, "Program ID is required"),
    title: z.string().min(3, "Program title must be at least 3 characters").max(120),
    description: z.string().min(10, "Program description must be at least 10 characters"),
    coverImage: z.string().optional().or(z.literal("")),
    difficultyLevel: z
      .enum(["BEGINNER", "MODERATE", "INTERMEDIATE", "ADVANCED", "HIGH_INTENSITY"])
      .default("INTERMEDIATE"),
    category: z.string().default("Pilates"),
    equipment: z.string().optional().or(z.literal("")),
    dailyCommitment: z.string().optional().or(z.literal("")),
    recommendedFor: z.string().min(2, "Recommended audience is required").max(400),
    coachName: z.string().min(2, "Coach name is required").max(300),
    coachTitle: z.string().optional().or(z.literal("")),
    durationDays: z.number().int().min(1).max(90),
    actualPrice: z.number().min(0, "Actual price must be 0 or higher").default(0),
    discountPercentage: z.number().int().min(0).max(100).default(0),
    price: z.number().min(0, "Price must be 0 or higher"),
    maxQuota: z.number().int().min(1, "Quota must be at least 1 participant"),
    communityLink: z.string().optional().or(z.literal("")),
    locationType: z.enum(["ONLINE", "ONSITE", "HYBRID"]).default("ONLINE"),
    city: z.string().optional().or(z.literal("")),
    venueAddress: z.string().optional().or(z.literal("")),
    virtualFallbackAvailable: z.boolean().default(true),
    startDate: z.union([z.string(), z.date()]),
    endDate: z.union([z.string(), z.date()]),
    registrationOpenDate: z.union([z.string(), z.date()]).optional().nullable(),
    registrationDeadline: z.union([z.string(), z.date()]),
    status: z.enum(["DRAFT", "PUBLISHED", "NOT_SHOW", "COMING_SOON", "ACTIVE"]).default("DRAFT"),
    isPublished: z.boolean().optional(),
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

export const SubmitDayProgressSchema = z.object({
  programDayId: z.string().min(1, "Program day ID is required"),
  videoWatched: z.boolean().optional(),
  isCompleted: z.boolean(),
  checklistCompleted: z.array(z.string()).default([]),
  selectedWorkout: z.string().optional().or(z.literal("")),
  photoBeforeUrl: z.string().optional().or(z.literal("")),
  photoAfterUrl: z.string().optional().or(z.literal("")),
  workoutNotes: z.string().optional().or(z.literal("")),
  eventFeedback: z.string().optional().or(z.literal("")),
  mealCompliance: z.string().optional().or(z.literal("")),
  mealNotes: z.string().optional().or(z.literal("")),
  dailyReflection: z.string().optional().or(z.literal("")),
  happinessRate: z.number().int().min(1).max(5).optional().nullable(),
  bedtime: z.string().optional().or(z.literal("")),
  wakeTime: z.string().optional().or(z.literal("")),
  sleepDurationMinutes: z.number().int().optional().nullable(),
  assessmentResponse: z.string().optional().or(z.literal("")),
});

/**
 * Helper to check if a single day module has sufficient content to be considered "Filled / Ready".
 */
export function isProgramDayComplete(day?: {
  title?: string | null;
  dayType?: string | null;
  videoUrl?: string | null;
  videoChecklist?: string[] | string | null;
  restInstructions?: string | null;
  onsiteVenue?: string | null;
  onsiteSchedule?: string | null;
  meetupLink?: string | null;
  eventTitle?: string | null;
  mapLink?: string | null;
} | null): boolean {
  if (!day || !day.title || day.title.trim().length < 2) return false;

  const type = day.dayType || "TRAINING_DAY";

  if (type === "TRAINING_DAY") {
    let checklistArr: string[] = [];
    if (Array.isArray(day.videoChecklist)) {
      checklistArr = day.videoChecklist.filter((i) => i && i.trim().length > 0);
    } else if (typeof day.videoChecklist === "string") {
      try {
        const parsed = JSON.parse(day.videoChecklist);
        if (Array.isArray(parsed)) {
          checklistArr = parsed.filter((i) => typeof i === "string" && i.trim().length > 0);
        }
      } catch {
        checklistArr = [];
      }
    }
    const hasVideo = !!day.videoUrl && day.videoUrl.trim().length > 0;
    return hasVideo || checklistArr.length > 0;
  }

  if (type === "REST_DAY") {
    return !!day.restInstructions && day.restInstructions.trim().length >= 3;
  }

  if (type === "CONNECTION_DAY" || type === "MEETUP_DAY") {
    return (
      (!!day.eventTitle && day.eventTitle.trim().length >= 2) ||
      (!!day.onsiteVenue && day.onsiteVenue.trim().length >= 2) ||
      (!!day.onsiteSchedule && day.onsiteSchedule.trim().length >= 2) ||
      (!!day.meetupLink && day.meetupLink.trim().length >= 5) ||
      (!!day.mapLink && day.mapLink.trim().length >= 5)
    );
  }

  return true;
}
