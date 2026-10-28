"use client";

export function AuraBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#f4f4f6] dark:bg-[#070709]">
      {/* Silver & Metallic Monochrome Base Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(255,255,255,0.98)_0%,_rgba(230,230,234,0.65)_45%,_rgba(244,244,246,0.95)_100%)] dark:bg-[radial-gradient(ellipse_at_top_left,_rgba(28,28,32,0.6)_0%,_rgba(7,7,9,0.98)_70%)]" />

      {/* Silver Chrome Reflection (Top Right -> Center) */}
      <div
        className="absolute -top-[10%] right-[6%] w-[50vw] h-[45vh] rounded-full opacity-60 dark:opacity-25 blur-[90px] animate-motion-streak"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(212,212,216,0.6) 45%, rgba(161,161,170,0.2) 100%)",
        }}
      />

      {/* Pure Silver Chrome Aura (Top Left / Ambient Reflection) */}
      <div
        className="absolute top-[8%] -left-[10%] w-[52vw] h-[50vh] rounded-full opacity-40 dark:opacity-20 blur-[100px] animate-motion-glide"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.95) 0%, rgba(228,228,231,0.5) 45%, rgba(161,161,170,0.15) 70%, transparent 85%)",
        }}
      />

      {/* Liquid Silver Chrome Streak (Center -> Bottom Right) */}
      <div
        className="absolute bottom-[8%] right-[10%] w-[46vw] h-[40vh] rounded-full opacity-55 dark:opacity-25 blur-[85px] animate-motion-glide"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(228,228,231,0.6) 50%, rgba(161,161,170,0.2) 100%)",
        }}
      />

      {/* Brushed Platinum & Chrome Horizon Streak (Bottom Left) */}
      <div
        className="absolute -bottom-[10%] left-[16%] w-[44vw] h-[34vh] rounded-full opacity-40 dark:opacity-15 blur-[95px] animate-motion-streak"
        style={{
          background:
            "linear-gradient(90deg, rgba(228,228,231,0.7) 0%, rgba(212,212,216,0.4) 55%, transparent 100%)",
        }}
      />

      {/* Ultra-Subtle Frosted Glass Veil for Crisp Monochrome Typography Contrast */}
      <div className="absolute inset-0 bg-white/15 dark:bg-black/55 backdrop-blur-[24px]" />
    </div>
  );
}
