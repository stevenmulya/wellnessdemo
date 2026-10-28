"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle visual theme"
      title={theme === "dark" ? "Switch to Pearl Light theme" : "Switch to Obsidian Dark theme"}
      className={`relative p-2 rounded-xl transition-all duration-300 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 border border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white ${className}`}
    >
      <div className="relative w-4 h-4">
        <Sun
          className={`w-4 h-4 absolute inset-0 transition-all duration-300 ${
            theme === "dark"
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100 text-zinc-800"
          }`}
        />
        <Moon
          className={`w-4 h-4 absolute inset-0 transition-all duration-300 ${
            theme === "dark"
              ? "rotate-0 scale-100 opacity-100 text-zinc-200"
              : "-rotate-90 scale-0 opacity-0"
          }`}
        />
      </div>
    </button>
  );
}
