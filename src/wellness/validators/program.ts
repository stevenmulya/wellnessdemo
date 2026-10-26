import { z } from "zod";

export const ProgramDayInputSchema = z.object({
  dayNumber: z.number().int().positive(),
  title: z.string().min(2, "Day title is required (min. 2 characters)").max(120),
  dayType: z.enum(["TRAINING_DAY", "REST_DAY", "MEETUP_DAY"]),
  videoUrl: z.string().optional().or(z.literal("")),
  videoChecklist: z.array(z.string()).default([]),
  mealRecommendation: z.string().optional().or(z.literal("")),
  dailyAssessment: z.string().optional().or(z.literal("")),
  pendingReminder: z.string().optional().or(z.literal("")),
  completedReminder: z.string().optional().or(z.literal("")),
  meetupLink: z.string().optional().or(z.literal("")),
  onsiteVenue: z.string().optional().or(z.literal("")),
  onsiteSchedule: z.string().optional().or(z.literal("")),
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
    recommendedFor: z
      .string()
      .min(3, "Recommended audience is required")
      .max(400)
      .default("All Levels • Mindful Movement & Longevity"),
    coachName: z.string().min(2, "Coach name is required").max(300),
    durationDays: z
      .number()
      .int()
      .min(1, "Program must be at least 1 day")
      .max(90, "Program cannot exceed 90 days")
      .default(21),
    price: z.number().min(0, "Price must be 0 or higher"),
    maxQuota: z.number().int().min(1, "Quota must be at least 1 participant").default(50),
    communityLink: z.string().optional().or(z.literal("")),
    locationType: z.enum(["ONLINE", "ONSITE", "HYBRID"]).default("ONLINE"),
    city: z.string().optional().or(z.literal("")),
    venueAddress: z.string().optional().or(z.literal("")),
    virtualFallbackAvailable: z.boolean().default(true),
    startDate: z.union([z.string(), z.date()]),
    endDate: z.union([z.string(), z.date()]),
    registrationDeadline: z.union([z.string(), z.date()]),
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
    recommendedFor: z.string().min(3, "Recommended audience is required").max(400),
    coachName: z.string().min(2, "Coach name is required").max(300),
    durationDays: z.number().int().min(1).max(90),
    price: z.number().min(0, "Price must be 0 or higher"),
    maxQuota: z.number().int().min(1, "Quota must be at least 1 participant"),
    communityLink: z.string().optional().or(z.literal("")),
    locationType: z.enum(["ONLINE", "ONSITE", "HYBRID"]).default("ONLINE"),
    city: z.string().optional().or(z.literal("")),
    venueAddress: z.string().optional().or(z.literal("")),
    virtualFallbackAvailable: z.boolean().default(true),
    startDate: z.union([z.string(), z.date()]),
    endDate: z.union([z.string(), z.date()]),
    registrationDeadline: z.union([z.string(), z.date()]),
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

  if (type === "MEETUP_DAY") {
    return (
      (!!day.onsiteVenue && day.onsiteVenue.trim().length >= 2) ||
      (!!day.onsiteSchedule && day.onsiteSchedule.trim().length >= 2)
    );
  }

  return true;
}
