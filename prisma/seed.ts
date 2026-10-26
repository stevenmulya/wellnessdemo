import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Running database seed for Wellness Platform...");

  // 1. Clean existing records in correct relation order
  await prisma.dayProgress.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.programDay.deleteMany();
  await prisma.program.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash default credentials
  const superadminPassword = await bcrypt.hash("SuperAdmin123!", 12);
  const userPassword = await bcrypt.hash("UserBudi123!", 12);

  // 3. Create Superadmin account
  const superadmin = await prisma.user.create({
    data: {
      email: "superadmin@wellness.test",
      fullName: "Super Administrator Wellness",
      phone: "+6281234567890",
      passwordHash: superadminPassword,
      role: "SUPERADMIN",
      status: "ACTIVE",
      tokenVersion: 0,
    },
  });
  console.log("✅ Superadmin seeded:", superadmin.email);

  // 4. Create Member account (Budi Santoso)
  const userBudi = await prisma.user.create({
    data: {
      email: "budi@wellness.test",
      fullName: "Budi Santoso",
      phone: "+6289876543210",
      passwordHash: userPassword,
      role: "USER",
      status: "ACTIVE",
      tokenVersion: 0,
    },
  });
  console.log("✅ Member seeded:", userBudi.email);

  // Normalize today at 00:00:00
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Program 1 starts 2 days ago so:
  // Day 1 = 2 days ago (Completed)
  // Day 2 = yesterday (Unfinished -> Automatically flagged as Skipped Day after 23:59!)
  // Day 3 = today (Current Active Day, unlocked at 00:00)
  // Day 4 & 5 = tomorrow & next day (Calendar Drip Locked until 00:00 on batch date)
  const prog1StartDate = new Date(todayStart.getTime() - 2 * 24 * 60 * 60 * 1000);
  const prog1EndDate = new Date(prog1StartDate.getTime() + 21 * 24 * 60 * 60 * 1000);
  const prog1RegDeadline = new Date(todayStart.getTime() + 10 * 24 * 60 * 60 * 1000);

  // 5. Create Program 1: Core Vitality & Mind Reset (Published & Live)
  const programYoga = await prisma.program.create({
    data: {
      title: "21-Day Holistic Yoga & Core Vitality",
      slug: "holistic-yoga-core-vitality",
      description:
        "Structured progressive cohort regimen focusing on thoracic mobility, core stability, and anti-inflammatory lifestyle habits.",
      recommendedFor: "All Levels • Desk Professionals • Spinal Mobility & Core",
      coachName: "Coach Sarah Jenkins, CPT",
      durationDays: 5,
      price: 299000,
      maxQuota: 35,
      communityLink: "https://chat.whatsapp.com/wellness-cohort-sanctuary",
      registrationDeadline: prog1RegDeadline,
      startDate: prog1StartDate,
      endDate: prog1EndDate,
      isPublished: true,
      days: {
        create: [
          {
            dayNumber: 1,
            title: "Awakening Spinal Alignment & Diaphragmatic Breath",
            dayType: "TRAINING_DAY",
            videoUrl: "https://www.youtube.com/watch?v=sTANio_2E0Q",
            videoChecklist: JSON.stringify([
              "5 min diaphragmatic breathing & posture check",
              "10 min spinal wave & cat-cow flow",
              "10 min gentle hamstring & glute release",
            ]),
            mealRecommendation:
              "Breakfast: Warm lemon water + rolled oats with chia seeds and wild blueberries.\nLunch: Grilled organic chicken breast with quinoa and avocado greens.\nDinner: Wild-caught steamed salmon with broccoli and sweet potato.",
            dailyAssessment:
              "How did your lower back feel during the spinal wave? Rate your morning energy level from 1 to 10.",
            pendingReminder:
              "Morning Reminder: Your Day 1 spinal mobility routine is unlocked. Dedicate 25 quiet minutes to your body today.",
            completedReminder:
              "Evening Note: Day 1 completed. Hydrate with 500ml mineral water and rest deeply.",
          },
          {
            dayNumber: 2,
            title: "Deep Core Bracing & Pelvic Stability",
            dayType: "TRAINING_DAY",
            videoUrl: "https://www.youtube.com/watch?v=v7AYKMP6rOE",
            videoChecklist: JSON.stringify([
              "Bird-dog posture hold (3 sets x 30s)",
              "Deadbug controlled core bracing (3 sets x 12 reps)",
              "Forearm plank breathing alignment (3 sets x 40s)",
            ]),
            mealRecommendation:
              "Anti-inflammatory berry smoothie with baby spinach, ground flaxseed, and clean plant protein.",
            dailyAssessment:
              "Were you able to maintain neutral pelvic alignment throughout the deadbug sets?",
            pendingReminder:
              "Morning Reminder: Step onto your mat for Day 2 core bracing before 23:59 tonight.",
            completedReminder:
              "Core activated! Strong foundation for effortless posture.",
          },
          {
            dayNumber: 3,
            title: "Thoracic Opening & Shoulder Decompression",
            dayType: "TRAINING_DAY",
            videoUrl: "https://www.youtube.com/watch?v=sTANio_2E0Q",
            videoChecklist: JSON.stringify([
              "Wall angels scapular glide (3 sets x 10 reps)",
              "Thread-the-needle thoracic rotation (60s each side)",
              "Supine chest opener with deep nasal breathing (5 mins)",
            ]),
            mealRecommendation:
              "Morning: Matcha or warm ginger infusion.\nLunch: Mediterranean olive oil bowl with roasted chickpeas, cucumber, and tahini.\nDinner: Poached white fish with asparagus.",
            dailyAssessment:
              "Notice your ribcage expansion after thoracic rotation. Rate neck and shoulder tension relief (1-10).",
            pendingReminder:
              "Today's Curriculum Unlocked: Complete both the workout video and self-assessment checklist before 23:59.",
            completedReminder:
              "Day 3 logged and verified. Your upper back posture is recalibrated.",
          },
          {
            dayNumber: 4,
            title: "Active Cellular Regeneration & Fascial Release",
            dayType: "REST_DAY",
            restInstructions:
              "Take a 25-minute unhurried outdoor walk in natural light, perform 10 minutes of gentle foam rolling or plantar fascia ball release, and practice 4-7-8 parasympathetic breathing before sleep.",
            mealRecommendation:
              "Hydration Protocol: Aim for 3 liters of mineral-rich water. Warm collagen bone broth or vegetable soup for dinner.",
            dailyAssessment:
              "Did you complete your 25-minute outdoor restorative walk and hydration target?",
            pendingReminder:
              "Rest Day Protocol: Recovery is where physiological adaptation occurs. Log your rest checklist before 23:59.",
            completedReminder:
              "Rest day logged. Your nervous system is primed for upcoming sessions.",
          },
          {
            dayNumber: 5,
            title: "On-Site Cohort Immersion & Posture Clinic",
            dayType: "MEETUP_DAY",
            meetupLink: "https://meet.google.com/wellness-weekly-sync",
            onsiteVenue: "The Sanctuary Wellness Pavilion, Senopati, South Jakarta (Hybrid Live Stream Available)",
            onsiteSchedule: "08:30 – 10:30 WIB • Mat & Organic Refreshments Provided",
            mealRecommendation:
              "Pre-session: Light cold-pressed green juice or warm herbal tea 60 minutes prior to arrival.",
            dailyAssessment:
              "Key posture adjustment or insight you received during today's cohort session:",
            pendingReminder:
              "Special Session: On-Site & Live Cohort Clinic today. Review venue and schedule details inside.",
            completedReminder:
              "Thank you for joining the cohort immersion! Connect with fellow members in the WhatsApp community.",
          },
        ],
      },
    },
    include: {
      days: true,
    },
  });

  // 6. Create Program 2: 14-Day Anti-Inflammatory Nutrition (Upcoming Batch)
  const prog2Start = new Date(todayStart.getTime() + 3 * 24 * 60 * 60 * 1000);
  const prog2End = new Date(prog2Start.getTime() + 14 * 24 * 60 * 60 * 1000);
  const prog2Deadline = new Date(todayStart.getTime() + 2 * 24 * 60 * 60 * 1000);

  const programNutrition = await prisma.program.create({
    data: {
      title: "14-Day Anti-Inflammatory Nutrition & Gut Reset",
      slug: "anti-inflammatory-gut-reset",
      description:
        "Scientifically validated whole-food nutritional protocols to reduce systemic inflammation, optimize gut microbiota, and enhance sleep depth.",
      recommendedFor: "Beginners & Intermediate • Gut Health & Clean Nutrition",
      coachName: "Dr. Marcus Vance, ND",
      durationDays: 2,
      price: 199000,
      maxQuota: 25,
      communityLink: "https://t.me/wellness_gut_reset_cohort",
      registrationDeadline: prog2Deadline,
      startDate: prog2Start,
      endDate: prog2End,
      isPublished: true,
      days: {
        create: [
          {
            dayNumber: 1,
            title: "Kitchen Audit & Anti-Inflammatory Pantry Setup",
            dayType: "TRAINING_DAY",
            videoUrl: "https://www.youtube.com/watch?v=sTANio_2E0Q",
            videoChecklist: JSON.stringify([
              "Eliminate refined seed oils (canola, soybean, corn)",
              "Stock extra virgin cold-pressed olive oil, avocado oil & ghee",
              "Prepare fermented probiotic staple (kefir, sauerkraut, or kimchi)",
            ]),
            mealRecommendation:
              "Morning: Warm green tea with sliced ginger.\nLunch: Wild greens bowl with pumpkin seeds, olive oil, and grilled tempeh/salmon.",
            dailyAssessment:
              "How many processed items did you replace during your kitchen audit today?",
            pendingReminder:
              "Day 1 begins in your kitchen! Watch the 10-minute guide and complete your audit checklist.",
            completedReminder:
              "Pantry audit complete! Your environment is aligned for effortless clean eating.",
          },
          {
            dayNumber: 2,
            title: "Circadian Digestive Rest & Glycemic Balance",
            dayType: "REST_DAY",
            restInstructions:
              "Observe a gentle 14-hour overnight digestive rest window (7:00 PM to 9:00 AM). Take a 10-minute walk after lunch to stabilize post-meal glucose.",
            mealRecommendation:
              "Break fast gently with warm broth followed by pasture-raised eggs, avocado, and sauteed greens.",
            dailyAssessment:
              "Did you complete the 14-hour overnight digestive rest window comfortably?",
            pendingReminder:
              "Support cellular autophagy and gut lining repair with today's circadian fasting window.",
            completedReminder:
              "Digestive rest completed. Notice the steady afternoon mental clarity.",
          },
        ],
      },
    },
  });

  // 6B. Create Program 3: Draft Program (Demonstrating Draft -> Day-by-Day -> Launch workflow)
  const prog3Start = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  const prog3End = new Date(prog3Start.getTime() + 7 * 24 * 60 * 60 * 1000);
  const prog3Deadline = new Date(todayStart.getTime() + 6 * 24 * 60 * 60 * 1000);

  const programDraft = await prisma.program.create({
    data: {
      title: "7-Day Parasympathetic Breathwork & Sleep Sanctuary",
      slug: "parasympathetic-breathwork-sleep-sanctuary",
      description:
        "Evening nervous system down-regulation, guided nasal breathwork, and circadian light hygiene for restorative deep sleep.",
      recommendedFor: "High-Stress Founders • Sleep Optimization & Recovery",
      coachName: "Coach Julian Thorne",
      durationDays: 7,
      price: 249000,
      maxQuota: 30,
      communityLink: "https://chat.whatsapp.com/wellness-sleep-sanctuary",
      registrationDeadline: prog3Deadline,
      startDate: prog3Start,
      endDate: prog3End,
      isPublished: false, // In DRAFT mode (2 of 7 days filled)
      days: {
        create: [
          {
            dayNumber: 1,
            title: "Evening Cadence & Box Breathing Foundation",
            dayType: "TRAINING_DAY",
            videoUrl: "https://www.youtube.com/watch?v=sTANio_2E0Q",
            videoChecklist: JSON.stringify([
              "Dim overhead lights 90 minutes before sleep",
              "10-min guided 4-4-4-4 box breathing",
            ]),
            mealRecommendation:
              "Warm chamomile & magnesium infusion 60 minutes before bed.",
            dailyAssessment:
              "How quickly did you fall asleep after completing the box breathing session?",
            pendingReminder:
              "Day 1 Evening Ritual: Prepare your room for tonight's breathwork session.",
            completedReminder:
              "Day 1 complete. Rest deeply tonight.",
          },
          {
            dayNumber: 2,
            title: "Digital Sunset & Parasympathetic Unwind",
            dayType: "REST_DAY",
            restInstructions:
              "Put all screens away 60 minutes before bed and practice 10 minutes of gentle supine spinal decompression.",
            mealRecommendation:
              "Finish dinner at least 3 hours prior to sleep for optimal heart rate variability.",
            dailyAssessment:
              "Did you maintain the 60-minute screen-free window tonight?",
            pendingReminder:
              "Day 2 Rest Protocol: Honor your digital sunset tonight.",
            completedReminder:
              "Day 2 logged. Your nervous system is recalibrating.",
          },
        ],
      },
    },
  });

  console.log("✅ Seeded programs:", programYoga.title, ",", programNutrition.title, "& Draft:", programDraft.title);

  // 7. Enroll Budi into Program 1 (ACTIVE access)
  const paidAt = new Date(prog1StartDate.getTime() - 24 * 60 * 60 * 1000);
  const validUntil = prog1EndDate;

  await prisma.enrollment.create({
    data: {
      userId: userBudi.id,
      programId: programYoga.id,
      status: "ACTIVE",
      paymentReference: "QRIS-WLS-882910",
      paidAt,
      validUntil,
    },
  });

  // Seed Day 1 completion for Budi (both videoWatched + checklist completed on Day 1)
  // Day 2 is intentionally left incomplete so the system automatically demonstrates "Skipped Day" logic!
  // Day 3 is Today (unlocked at 00:00, ready for user interaction)
  const day1 = programYoga.days.find((d) => d.dayNumber === 1);
  if (day1) {
    await prisma.dayProgress.create({
      data: {
        userId: userBudi.id,
        programDayId: day1.id,
        videoWatched: true,
        isCompleted: true,
        checklistCompleted: JSON.stringify([
          "5 min diaphragmatic breathing & posture check",
          "10 min spinal wave & cat-cow flow",
          "10 min gentle hamstring & glute release",
        ]),
        assessmentResponse:
          "Energy was 8/10. Lower back felt significantly lighter after the spinal wave sequence.",
        completedAt: new Date(prog1StartDate.getTime() + 10 * 60 * 60 * 1000),
      },
    });
  }

  // Enroll Budi into Program 2 (PENDING QRIS Invoice with 15-min validity window)
  const invoiceExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await prisma.enrollment.create({
    data: {
      userId: userBudi.id,
      programId: programNutrition.id,
      status: "PENDING",
      paymentReference: "QRIS-WLS-994021",
      invoiceExpiresAt,
    },
  });

  console.log("✅ Sample enrollments seeded for Budi (1 ACTIVE cohort with Day 1 completed, Day 2 skipped, Day 3 today; 1 PENDING QRIS invoice)");
  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during database seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
