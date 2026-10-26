"use client";

export function AuraBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#f4f4f8] dark:bg-[#09090b]">
      {/* Silver & Metallic Monochrome Base Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(255,255,255,0.95)_0%,_rgba(228,228,231,0.55)_45%,_rgba(244,244,242,0.9)_100%)] dark:bg-[radial-gradient(ellipse_at_top_left,_rgba(39,39,42,0.45)_0%,_rgba(9,9,11,0.95)_70%)]" />

      {/* Kinetic Orange Motion-Blur Streak (Top Right -> Center) */}
      <div
        className="absolute -top-[8%] right-[4%] w-[52vw] h-[44vh] rounded-full opacity-55 dark:opacity-30 blur-[85px] animate-motion-streak"
        style={{
          background:
            "linear-gradient(115deg, rgba(249,115,22,0.52) 0%, rgba(251,146,60,0.38) 45%, rgba(228,228,231,0.2) 100%)",
        }}
      />

      {/* Kinetic Silver & Warm Amber Motion-Blur Orb (Left Center) */}
      <div
        className="absolute top-[18%] -left-[12%] w-[58vw] h-[56vh] rounded-full opacity-40 dark:opacity-20 blur-[75px] animate-motion-glide"
        style={{
          background:
            "radial-gradient(circle at center, rgba(251,146,60,0.45) 0%, rgba(228,228,231,0.3) 50%, transparent 75%)",
        }}
      />

      {/* Liquid Silver Chrome Streak (Center -> Bottom Right) */}
      <div
        className="absolute bottom-[5%] right-[12%] w-[48vw] h-[42vh] rounded-full opacity-75 dark:opacity-20 blur-[75px] animate-motion-glide"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(212,212,216,0.65) 50%, rgba(249,115,22,0.28) 100%)",
        }}
      />

      {/* Soft Orange Horizon Motion Streak (Bottom Left) */}
      <div
        className="absolute -bottom-[12%] left-[18%] w-[45vw] h-[36vh] rounded-full opacity-45 dark:opacity-25 blur-[95px] animate-motion-streak"
        style={{
          background:
            "linear-gradient(90deg, rgba(234,88,12,0.42) 0%, rgba(253,186,116,0.32) 55%, rgba(255,255,255,0.6) 100%)",
        }}
      />

      {/* Ultra-Subtle Glass Veil for Crisp Typography Contrast */}
      <div className="absolute inset-0 bg-white/20 dark:bg-black/45 backdrop-blur-[24px]" />
    </div>
  );
}
