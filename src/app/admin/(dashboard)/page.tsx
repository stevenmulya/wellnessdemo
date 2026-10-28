import { redirect } from "next/navigation";
import { getWellnessSession } from "@/wellness/security/session";
import { prisma } from "@/wellness/db";
import { AdminClient } from "@/components/admin/AdminClient";
import { safeJsonParse } from "@/wellness/utils/json";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getWellnessSession();

  if (!session || session.role !== "SUPERADMIN") {
    redirect("/?auth=signin&target=admin");
  }

  // Optimized parallel queries: Fetch users, program hierarchy, master data, and aggregated subscriber statistics
  const [
    users,
    programsData,
    enrollmentStats,
    masterCoaches,
    masterTargetAudiences,
    masterCategories,
  ] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        enrollments: {
          select: {
            id: true,
            status: true,
            paymentReference: true,
            paidAt: true,
            validUntil: true,
            program: {
              select: {
                id: true,
                title: true,
                price: true,
                _count: { select: { days: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.program.findMany({
      include: {
        days: {
          orderBy: { dayNumber: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.enrollment.groupBy({
      by: ["programId", "status"],
      _count: { id: true },
    }),
    prisma.masterCoach.findMany({ orderBy: { name: "asc" } }),
    prisma.masterTargetAudience.findMany({ orderBy: { name: "asc" } }),
    prisma.masterCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  // Build O(1) subscriber count lookup map from SQL group-by
  const statsMap: Record<string, { active: number; pending: number }> = {};
  for (const stat of enrollmentStats) {
    if (!statsMap[stat.programId]) {
      statsMap[stat.programId] = { active: 0, pending: 0 };
    }
    if (stat.status === "ACTIVE") {
      statsMap[stat.programId].active = stat._count.id;
    } else if (stat.status === "PENDING") {
      statsMap[stat.programId].pending = stat._count.id;
    }
  }

  const programs = programsData.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description,
    category: p.category || "Pilates",
    recommendedFor: p.recommendedFor,
    coachName: p.coachName,
    coachTitle: p.coachTitle || null,
    durationDays: p.durationDays,
    actualPrice: p.actualPrice,
    discountPercentage: p.discountPercentage,
    price: p.price,
    maxQuota: p.maxQuota,
    locationType: p.locationType,
    city: p.city,
    venueAddress: p.venueAddress,
    virtualFallbackAvailable: p.virtualFallbackAvailable,
    communityLink: p.communityLink,
    startDate: p.startDate,
    endDate: p.endDate,
    registrationOpenDate: p.registrationOpenDate,
    registrationDeadline: p.registrationDeadline,
    status: ((p.status as "NOT_SHOW" | "COMING_SOON" | "ACTIVE" | "DRAFT" | "PUBLISHED") || (p.isPublished ? "PUBLISHED" : "DRAFT")),
    isPublished: p.isPublished,
    dayCount: p.days.length,
    activeSubscribers: statsMap[p.id]?.active || 0,
    pendingSubscribers: statsMap[p.id]?.pending || 0,
    days: p.days.map((d) => ({
      id: d.id,
      dayNumber: d.dayNumber,
      title: d.title,
      dayType: d.dayType,
      workoutOptions: safeJsonParse<string[]>(d.workoutOptions, []),
      sleepRecommendation: d.sleepRecommendation,
      dayNotifications: safeJsonParse<Array<{ time: string; message: string; label?: string }>>(d.dayNotifications, []),
      videoUrl: d.videoUrl,
      videoChecklist: safeJsonParse<string[]>(d.videoChecklist, []),
      mealRecommendation: d.mealRecommendation,
      dailyAssessment: d.dailyAssessment,
      pendingReminder: d.pendingReminder,
      completedReminder: d.completedReminder,
      meetupLink: d.meetupLink,
      onsiteVenue: d.onsiteVenue,
      onsiteSchedule: d.onsiteSchedule,
      restInstructions: d.restInstructions,
      coachName: d.coachName,
      recommendedFor: d.recommendedFor,
    })),
  }));

  return (
    <AdminClient
      initialUsers={users}
      initialPrograms={programs}
      initialMasterData={{
        coaches: masterCoaches,
        targetAudiences: masterTargetAudiences,
        categories: masterCategories,
      }}
      currentAdminId={session.userId}
    />
  );
}
