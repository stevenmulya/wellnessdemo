"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AuthModal } from "@/components/auth/AuthModal";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import {
  ArrowRight,
  ArrowUpRight,
  Shield,
  LayoutDashboard,
  Calendar,
  User,
  Users,
  Sparkles,
  Clock,
  Dumbbell,
  CheckCircle2,
  Quote,
  MessageCircle,
  Mail,
  MapPin,
  Heart,
  Moon,
  Coffee,
  Video,
} from "lucide-react";

interface LandingClientProps {
  sessionUser: {
    userId: string;
    email: string;
    fullName: string;
    role: string;
  } | null;
  programs: Array<{
    id: string;
    title: string;
    slug: string;
    description: string;
    recommendedFor?: string | null;
    coachName?: string | null;
    durationDays?: number;
    price: number;
    maxQuota: number;
    enrolledCount: number;
    isUserEnrolled?: boolean;
    locationType?: string | null;
    city?: string | null;
    venueAddress?: string | null;
    virtualFallbackAvailable?: boolean | null;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    registrationDeadline?: Date | string | null;
    dayCount: number;
  }>;
}

const TESTIMONIALS = [
  {
    name: "Clarissa Wijaya",
    role: "Creative Director",
    cohort: "Cohort 01 • Movement Ritual",
    quote:
      "The 00:00 unlock gave me my mornings back. No endless scrolling—just 25 focused minutes of mobility, a clean meal guide, and a quiet sense of accomplishment.",
    stat: "21 / 21 Days",
  },
  {
    name: "Adrian Gunawan",
    role: "Architect & Runner",
    cohort: "Cohort 02 • Mobility Core",
    quote:
      "The combination of daily video routines and the evening 23:59 reflection created a discipline I couldn't build on my own. Truly quiet luxury.",
    stat: "Zero Skipped Days",
  },
  {
    name: "Nadia Kusuma",
    role: "Founder",
    cohort: "Cohort 03 • Breath & Sleep",
    quote:
      "Our Saturday morning offline studio meetup at Senopati felt so authentic. A rare digital wellness space that actually translates into real life.",
    stat: "2 Cohorts Completed",
  },
];

const COACH_PROFILES = [
  {
    name: "Marcus Vance",
    role: "Lead Movement & Mobility Coach",
    specialty: "Functional Movement & Spine Longevity",
    bio: "Former physical performance practitioner focusing on spinal decompression, joint mobility, and posture recovery for desk workers.",
    image: "/coach.jpg",
  },
  {
    name: "Elena Rostova",
    role: "Head of Nutrition & Longevity",
    specialty: "Anti-Inflammatory Whole Foods",
    bio: "Curates simple, repeatable daily meal protocols designed to stabilize metabolic energy and support natural cellular recovery.",
    image: "/coach2.jpg",
  },
  {
    name: "Julian Thorne",
    role: "Breathwork & Nervous System Director",
    specialty: "Parasympathetic Recovery & Deep Sleep",
    bio: "Guides breath regulation routines that transition high-stress executives into deep, restorative sleep cycles.",
    image: "/coach3.jpg",
  },
];

const BRAND_PARTNERS = [
  { name: "AESOP", category: "Botanical Partner" },
  { name: "ALO SANCTUARY", category: "Movement Gear" },
  { name: "OURA", category: "Recovery Science" },
  { name: "EQUINOX", category: "Studio Partner" },
  { name: "EREWHON", category: "Nutrition Curation" },
  { name: "KINFOLK", category: "Editorial Feature" },
];

export function LandingClient({ sessionUser, programs }: LandingClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup" | "forgot">("signup");
  const [deletedNotice, setDeletedNotice] = useState(false);

  useEffect(() => {
    const authQuery = searchParams.get("auth");
    const isDeleted = searchParams.get("deleted");

    if (authQuery === "signin" || authQuery === "signup" || authQuery === "forgot") {
      setAuthTab(authQuery);
      setAuthModalOpen(true);
    }
    if (isDeleted === "true") {
      setDeletedNotice(true);
    }
  }, [searchParams]);

  // 1. ScrollTrigger Text & Element Appearance (Blur & Slide-In)
  useEffect(() => {
    const revealElements = document.querySelectorAll<HTMLElement>(".reveal-init");
    if (revealElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-active");
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    revealElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // 3. Ultra-Smooth Parallax Engine for Full-Width and Card Background Images
  useEffect(() => {
    let ticking = false;

    const updateParallax = () => {
      const parallaxEls = document.querySelectorAll<HTMLElement>("[data-parallax]");
      const vh = window.innerHeight;

      parallaxEls.forEach((el) => {
        const rect = el.parentElement?.getBoundingClientRect() || el.getBoundingClientRect();
        if (rect.bottom > -100 && rect.top < vh + 100) {
          const speed = parseFloat(el.getAttribute("data-parallax") || "0.15");
          const offset = (rect.top + rect.height / 2 - vh / 2) * speed;
          el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0) scale(1.15)`;
        }
      });
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    updateParallax();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const openAuth = (tab: "signin" | "signup" | "forgot" = "signup") => {
    setAuthTab(tab);
    setAuthModalOpen(true);
  };

  const handleProgramAction = (programId: string) => {
    if (sessionUser) {
      router.push(`/dashboard?enroll=${programId}`);
    } else {
      openAuth("signup");
    }
  };

  const formatDate = (dateVal?: Date | string | null) => {
    if (!dateVal) return null;
    const d = new Date(dateVal);
    return isNaN(d.getTime())
      ? null
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden text-xs text-zinc-900 dark:text-zinc-100 silver-orange-canvas">
      {/* Account Deletion Notice */}
      {deletedNotice && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md glass-panel py-3 px-4 rounded-2xl text-xs font-medium flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-orange-500" />
            <span>Your account has been deleted.</span>
          </div>
          <button
            onClick={() => setDeletedNotice(false)}
            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* FLOATING GLASS DOCK NAVIGATION                                       */}
      {/* ===================================================================== */}
      <header
        style={{ top: "max(1.25rem, env(safe-area-inset-top))" }}
        className="fixed left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-5xl h-14 px-5 rounded-2xl blur-dock flex items-center justify-between transition-all duration-300"
      >
        <Link href="/" className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
          <span className="font-bold text-xs uppercase tracking-[0.2em] text-zinc-900 dark:text-white">
            Wellness
          </span>
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6 text-[11px] font-medium">
          <a
            href="#community"
            className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition hidden md:inline"
          >
            Community
          </a>
          <a
            href="#stories"
            className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition hidden sm:inline"
          >
            Stories
          </a>
          <a
            href="#programs"
            className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition"
          >
            Cohorts
          </a>
          <a
            href="#team"
            className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition hidden md:inline"
          >
            Coaches
          </a>
          <a
            href="#contact"
            className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition"
          >
            Concierge
          </a>

          <div className="h-3.5 w-px bg-zinc-300/80 dark:bg-white/15" />

          <ThemeToggle />

          {sessionUser ? (
            <div className="flex items-center gap-2">
              {sessionUser.role === "SUPERADMIN" && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-panel-subtle text-[11px] font-medium text-zinc-900 dark:text-white"
                >
                  <Shield className="w-3 h-3" /> Admin
                </Link>
              )}
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl chrome-button text-[11px] font-medium"
              >
                <LayoutDashboard className="w-3 h-3" /> Dashboard
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openAuth("signin")}
                className="px-2.5 py-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition text-[11px] font-medium"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => openAuth("signup")}
                className="px-3.5 py-1.5 rounded-xl chrome-button text-[11px] font-medium"
              >
                Create Account
              </button>
            </div>
          )}
        </nav>
      </header>

      {/* ===================================================================== */}
      {/* 1. EYE CATCHING FULL WIDTH HOME HERO (WITH PIC.JPG FULL BACKGROUND)  */}
      {/* ===================================================================== */}
      <section className="relative w-full min-h-[92vh] pt-32 pb-20 px-5 sm:px-8 flex items-center justify-center overflow-hidden">
        {/* Full-width Ambient Motion Video with pic.jpg Poster Fallback & Parallax */}
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/pic.jpg"
          data-parallax="0.08"
          className="absolute inset-0 w-full h-full object-cover scale-110 pointer-events-none will-change-transform"
        >
          <source src="/video.mp4" type="video/mp4" />
        </video>
        {/* Luminous, light glass scrims so the ambient video/pic.jpg is fully visible and vibrant */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20" />

        <div className="relative z-10 max-w-5xl mx-auto w-full space-y-6">
          {/* Main Asymmetric Grid */}
          <div className="grid lg:grid-cols-12 gap-6 items-stretch">
            {/* Primary Hero Card (7 Columns) with Glassmorphic Overlay */}
            <div className="lg:col-span-7 reveal-init relative rounded-3xl overflow-hidden glass-image-overlay border border-white/20 p-8 sm:p-12 min-h-[460px] flex flex-col justify-between text-white shadow-2xl">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-semibold uppercase tracking-[0.16em]">
                  <Sparkles className="w-3 h-3 text-orange-400" />
                  <span>Private Cohort Platform</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.12]">
                  Daily movement, clean food &{" "}
                  <span className="font-serif-luxury italic font-normal text-orange-200">
                    quiet longevity.
                  </span>
                </h1>

                <p className="text-xs sm:text-sm text-zinc-200/90 leading-relaxed max-w-lg">
                  Every morning at 00:00, your daily workout video and nutrition ritual unlock in sync with your 35-member cohort.
                </p>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-3">
                {sessionUser ? (
                  <Link
                    href="/dashboard"
                    className="px-6 py-3 rounded-2xl chrome-button text-xs font-semibold inline-flex items-center gap-2 shadow-lg"
                  >
                    Enter Member Dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => openAuth("signup")}
                      className="px-6 py-3 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-semibold inline-flex items-center gap-2 transition shadow-xl"
                    >
                      Create Free Account <ArrowRight className="w-4 h-4" />
                    </button>
                    <a
                      href="#programs"
                      className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition text-xs font-medium"
                    >
                      Explore Cohorts
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Asymmetric Side Stack (5 Columns) */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-5">
              {/* Card 1: 00:00 Synchronized Rhythm */}
              <div className="reveal-init reveal-delay-100 glass-image-overlay rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-4 border border-white/15 text-white shadow-xl flex-1">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-2xl bg-white/10 flex items-center justify-center text-orange-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-300">
                    Circadian Rhythm
                  </span>
                </div>
                <div>
                  <div className="text-3xl font-light tracking-tight text-white">
                    00:00
                  </div>
                  <h3 className="text-xs font-semibold text-white mt-1">
                    Morning Routine Unlock
                  </h3>
                  <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                    A single intentional routine ready when you wake up. No decision fatigue.
                  </p>
                </div>
                <div className="pt-2 border-t border-white/15 text-[11px] text-orange-300 font-medium">
                  23:59 Nightly Streak Cutoff
                </div>
              </div>

              {/* Card 2: Intimate 35-Member Cohorts */}
              <div className="reveal-init reveal-delay-200 glass-image-overlay rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-3 border border-white/15 text-white shadow-xl flex-1">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-2xl bg-white/10 flex items-center justify-center text-orange-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-[9px] font-semibold uppercase tracking-wider">
                    Community Spirit
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold tracking-tight text-white">
                    Intimate 35-Member Cohorts
                  </h4>
                  <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                    Real accountability with verified members on the exact same daily rhythm.
                  </p>
                </div>
                <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-zinc-300">
                  <span>Weekly Studio Gathering</span>
                  <span className="font-semibold text-white">Senopati, JKT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 2. WELLNESS COMMUNITY INTRODUCTION (THE SANCTUARY CONCEPT)            */}
      {/* ===================================================================== */}
      <section id="community" className="py-20 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="max-w-2xl space-y-2 reveal-init">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400 block">
              The Sanctuary Concept
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              A private digital ecosystem designed for calm consistency.
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              We replace endless fitness content with structured, time-bound cohort journeys. Members progress day-by-day together, building physical resilience without burnout.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {/* Feature 1 */}
            <div className="reveal-init reveal-delay-100 glass-panel rounded-3xl p-6 sm:p-7 space-y-4">
              <div className="w-10 h-10 rounded-2xl glass-panel-subtle flex items-center justify-center text-orange-500">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  One Guided Routine
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  20 to 30 minutes of intentional functional movement, core stability, and spinal decompression led by our head coach.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="reveal-init reveal-delay-200 glass-panel rounded-3xl p-6 sm:p-7 space-y-4">
              <div className="w-10 h-10 rounded-2xl glass-panel-subtle flex items-center justify-center text-orange-500">
                <Coffee className="w-4 h-4" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Clean Nutrition Guide
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Anti-inflammatory whole food suggestions designed to reduce gut fatigue and sustain steady energy without restrictive dieting.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="reveal-init reveal-delay-300 glass-panel rounded-3xl p-6 sm:p-7 space-y-4">
              <div className="w-10 h-10 rounded-2xl glass-panel-subtle flex items-center justify-center text-orange-500">
                <Moon className="w-4 h-4" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Rest Days & Gatherings
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Dedicated recovery days with breathwork rituals and offline weekend studio gatherings in South Jakarta.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 2B. FULL WIDTH SANCTUARY BREAK SECTION (WITH TEST.JPG FULL BACKGROUND)*/}
      {/* ===================================================================== */}
      <section className="relative w-full py-28 sm:py-36 overflow-hidden flex items-center justify-center px-5 sm:px-8 my-4">
        {/* Full-width Section Background Image using test.jpg with Parallax */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Image
            src="/test.jpg"
            alt="Sanctuary Movement Ritual"
            fill
            data-parallax="0.14"
            className="object-cover object-center will-change-transform scale-110"
          />
        </div>
        {/* Luminous light scrim so test.jpg is vividly seen */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/35 pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto w-full text-center text-white space-y-6">
          <div className="reveal-init glass-image-overlay rounded-3xl p-8 sm:p-14 space-y-5 border border-white/20 shadow-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-300">
              <Sparkles className="w-3 h-3" />
              <span>Synchronized Movement Ritual</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight leading-tight">
              Never train in isolation again.
            </h2>

            <p className="text-xs sm:text-sm text-zinc-200/90 leading-relaxed max-w-xl mx-auto">
              Wake up with clarity. Every morning at 00:00, experience synchronized workouts and clean nutrition alongside your 35-person batch, culminating in offline studio gatherings.
            </p>

            {!sessionUser && (
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => openAuth("signup")}
                  className="px-7 py-3.5 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-bold inline-flex items-center gap-2 transition shadow-2xl"
                >
                  <span>Register Free Account</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3. TESTIMONIALS (MEMBER STORIES GRID)                                 */}
      {/* ===================================================================== */}
      <section id="stories" className="py-16 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="reveal-init flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400 block">
                Member Experiences
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Quiet transformations, shared.
              </h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
              Hear from founders, directors, and professionals in our cohorts.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className={`reveal-init reveal-delay-${(i + 1) * 100} glass-panel rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-5`}
              >
                <div className="space-y-3">
                  <Quote className="w-5 h-5 text-orange-500/70" />
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-900/[0.06] dark:border-white/10 flex items-center justify-between text-[11px]">
                  <div>
                    <strong className="text-zinc-900 dark:text-white block font-semibold">
                      {t.name}
                    </strong>
                    <span className="text-zinc-500 dark:text-zinc-400 text-[10px]">
                      {t.role}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full glass-panel-subtle text-[10px] text-zinc-700 dark:text-zinc-300 font-medium">
                    {t.stat}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 4. ACTIVE PROGRAMS (FULL BACKGROUND IMAGE CARDS WITH PARALLAX)         */}
      {/* ===================================================================== */}
      <section id="programs" className="py-16 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="reveal-init flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400 block">
                Active & Upcoming Batches
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Choose your cohort journey.
              </h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
              Strictly limited to 35 participants per batch to maintain intimacy.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {programs.map((prog, idx) => {
              const startDate = formatDate(prog.startDate);
              const remainingSpots = Math.max(0, prog.maxQuota - prog.enrolledCount);

              return (
                <div
                  key={prog.id}
                  className={`reveal-init reveal-delay-${(idx + 1) * 100} relative rounded-3xl overflow-hidden glass-panel border border-white/60 dark:border-white/10 min-h-[380px] p-6 sm:p-7 flex flex-col justify-between group shadow-xl`}
                >
                  {/* Full background image of cohort with parallax */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <Image
                      src={idx % 2 === 0 ? "/test.jpg" : "/pic.jpg"}
                      alt={prog.title}
                      fill
                      data-parallax="0.10"
                      className="object-cover object-center will-change-transform scale-110 group-hover:scale-115 transition-transform duration-700"
                    />
                  </div>
                  {/* Lighter scrim so the cohort background photo is vibrant and clear */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/20 pointer-events-none" />

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

                    <span className="px-3 py-1 rounded-full glass-image-overlay text-[11px] font-medium text-white flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-orange-400" />
                      <span>{remainingSpots} spots remaining</span>
                    </span>
                  </div>

                  {/* Bottom Floating Glassmorphic Content Card */}
                  <div className="relative z-10 glass-image-overlay rounded-2xl p-5 space-y-3 text-white border border-white/20 backdrop-blur-xl">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[11px] text-zinc-300">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-orange-400" /> {prog.coachName}
                        </span>
                        {startDate && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-orange-400" /> Starts {startDate}
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
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

                    <div className="pt-3 border-t border-white/15 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">
                          Tuition
                        </span>
                        <span className="text-base font-bold text-white">
                          Rp {prog.price.toLocaleString("id-ID")}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleProgramAction(prog.id)}
                        className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-semibold inline-flex items-center gap-1.5 transition shadow"
                      >
                        {sessionUser ? (
                          <>
                            Open Dashboard <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            Join Cohort <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 5. TEAM / PRACTITIONER COACH PROFILES (IMAGE AS FULL CARD BACKGROUND) */}
      {/* ===================================================================== */}
      <section id="team" className="py-16 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="reveal-init max-w-xl space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400 block">
              Practitioners & Coaches
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Guided by dedicated specialists.
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Each movement sequence, meal protocol, and breath gathering is designed by our core team.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {COACH_PROFILES.map((coach, idx) => (
              <div
                key={idx}
                className={`reveal-init reveal-delay-${(idx + 1) * 100} relative rounded-3xl overflow-hidden glass-panel border border-white/60 dark:border-white/10 min-h-[470px] p-6 sm:p-7 flex flex-col justify-between group shadow-xl`}
              >
                {/* Image is the FULL BACKGROUND of the entire widget with Parallax */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <Image
                    src={coach.image}
                    alt={coach.name}
                    fill
                    data-parallax="0.12"
                    className="object-cover object-top will-change-transform scale-110 group-hover:scale-115 transition-transform duration-700"
                  />
                </div>
                {/* Luminous gradient scrim so coach portrait is vivid while overlay text stays crisp */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/15 pointer-events-none" />

                {/* Top Badge */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full glass-image-overlay text-[10px] font-semibold uppercase tracking-wider text-white">
                    {coach.specialty.split("&")[0].trim()}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50" />
                </div>

                {/* Floating Glassmorphic Text Card on top of background image */}
                <div className="relative z-10 glass-image-overlay rounded-2xl p-4 sm:p-5 space-y-2 text-white border border-white/20 backdrop-blur-xl">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold tracking-tight text-white">
                      {coach.name}
                    </h3>
                    <span className="text-[10px] uppercase tracking-wider text-orange-400 font-semibold block">
                      {coach.role}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-200/90 leading-relaxed line-clamp-2">
                    {coach.bio}
                  </p>
                  <div className="pt-2 border-t border-white/15 text-[10px] text-zinc-300 flex items-center justify-between">
                    <span>Specialty Focus</span>
                    <span className="font-medium text-white">{coach.specialty}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 6. PARTNERS (MINIMAL LUXURY LOGO RIBBON)                             */}
      {/* ===================================================================== */}
      <section id="partners" className="py-12 px-5 sm:px-6 border-t border-zinc-900/[0.06] dark:border-white/10">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="reveal-init text-center space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 block">
              Collaborations & Studio Venues
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {BRAND_PARTNERS.map((p, idx) => (
              <div
                key={idx}
                className={`reveal-init reveal-delay-${((idx % 3) + 1) * 100} glass-panel rounded-2xl p-4 text-center flex flex-col items-center justify-center gap-1`}
              >
                <span className="text-xs font-bold tracking-widest uppercase text-zinc-900 dark:text-white">
                  {p.name}
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {p.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 7. FULL WIDTH CONTACT CONCIERGE (WITH PIC.JPG FULL BACKGROUND)        */}
      {/* ===================================================================== */}
      <section id="contact" className="relative w-full py-28 sm:py-36 overflow-hidden flex items-center justify-center px-5 sm:px-8">
        {/* Full-width Section Background Image using pic.jpg with Parallax */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Image
            src="/pic.jpg"
            alt="Sanctuary Studio Concierge"
            fill
            data-parallax="0.12"
            className="object-cover object-center will-change-transform scale-110"
          />
        </div>
        {/* Luminous light scrim so pic.jpg shines through clearly */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-black/35 pointer-events-none" />

        <div className="reveal-init relative z-10 max-w-xl mx-auto w-full text-center text-white">
          <div className="glass-image-overlay rounded-3xl p-8 sm:p-14 space-y-6 border border-white/20 shadow-2xl">
            <div className="space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-400 block">
                Direct Concierge
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Connect with our team.
              </h2>
              <p className="text-xs text-zinc-200 leading-relaxed">
                Have questions regarding upcoming cohort dates or studio access? Reach out directly to our concierge team.
              </p>
            </div>

            {/* Direct Contact Buttons (NO Form Fields) */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href="https://wa.me/6281290002026?text=Hello%20Wellness%20Sanctuary,%20I%20would%20like%20to%20inquire%20about%20the%20upcoming%20cohort."
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-semibold inline-flex items-center gap-2 transition shadow-xl"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Chat via WhatsApp</span>
              </a>

              <a
                href="mailto:concierge@wellness.id?subject=Cohort%20Inquiry"
                className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition text-xs font-medium inline-flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                <span>Email Concierge</span>
              </a>
            </div>

            <div className="pt-4 border-t border-white/10 text-[11px] text-zinc-300 flex items-center justify-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span>Studio: Senopati, South Jakarta • Open for registered cohorts</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* MINIMAL FOOTER                                                        */}
      {/* ===================================================================== */}
      <footer className="mt-auto py-8 px-6 border-t border-zinc-900/[0.06] dark:border-white/10 text-zinc-500 text-[11px]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            <span className="font-semibold text-zinc-900 dark:text-white uppercase tracking-wider text-[10px]">
              Wellness
            </span>
            <span>• Private Movement & Longevity Platform</span>
          </div>

          <div className="flex items-center gap-4">
            {!sessionUser && (
              <>
                <button
                  type="button"
                  onClick={() => openAuth("signin")}
                  className="hover:text-zinc-900 dark:hover:text-white transition"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => openAuth("signup")}
                  className="hover:text-zinc-900 dark:hover:text-white transition"
                >
                  Create Account
                </button>
              </>
            )}
            <span>© 2026 Wellness</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authTab}
      />
    </div>
  );
}
