"use client";

import { motion } from "motion/react";

type PlayMode = "hover" | "all";

interface PlayModeToggleProps {
  value: PlayMode;
  onChange: (mode: PlayMode) => void;
}

export function PlayModeToggle({ value, onChange }: PlayModeToggleProps) {
  const isAll = value === "all";

  return (
    <div className="inline-flex items-center gap-3">
      <span className="text-[13px] font-medium text-(--color-text-tertiary) select-none">
        On hover
      </span>
      <button
        type="button"
        className={`relative flex items-center w-11 h-6 p-0.5 rounded-full cursor-pointer shrink-0 transition-colors duration-200 ease ${
          isAll ? "bg-(--color-toggle-active-bg)" : "bg-(--color-toggle-inactive-bg)"
        }`}
        onClick={() => onChange(isAll ? "hover" : "all")}
        aria-checked={isAll}
        role="switch"
      >
        <motion.div
          className="w-5 h-5 bg-(--color-toggle-knob) rounded-full shadow-sm"
          initial={false}
          animate={{ x: isAll ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
      <span className="text-[13px] font-medium text-(--color-text-tertiary) select-none">
        Play all
      </span>
    </div>
  );
}
