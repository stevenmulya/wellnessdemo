import { Suspense } from "react";
import { getWellnessSession } from "@/wellness/security/session";
import { prisma } from "@/wellness/db";
import { LandingClient } from "@/components/home/LandingClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const sessionUser = await getWellnessSession();

  // Optimized parallel queries: Fetch published programs with counts only, and if logged in, targeted user active enrollments
  const [programs, userEnrollments] = await Promise.all([
    prisma.program.findMany({
      where: { isPublished: true },
      include: {
        _count: {
          select: {
            days: true,
            enrollments: { where: { status: "ACTIVE" } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    sessionUser
      ? prisma.enrollment.findMany({
          where: { userId: sessionUser.userId, status: "ACTIVE" },
          select: { programId: true },
        })
      : Promise.resolve([]),
  ]);

  const userActiveProgramIds = new Set(userEnrollments.map((e) => e.programId));

  const formattedPrograms = programs.map((p) => ({
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
    isUserEnrolled: userActiveProgramIds.has(p.id),
    startDate: p.startDate,
    endDate: p.endDate,
    registrationDeadline: p.registrationDeadline,
    dayCount: p._count.days || p.durationDays,
  }));

  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LandingClient
        sessionUser={sessionUser}
        programs={formattedPrograms}
      />
    </Suspense>
  );
}
