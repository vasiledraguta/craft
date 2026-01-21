"use client";

import { useState } from "react";
import { DotGrid } from "./DotGrid";
import type { PatternName } from "@/lib/patterns";

interface GridCardProps {
  size: 3 | 5 | 9;
  pattern: PatternName;
  label: string;
  playAll?: boolean;
}

export function GridCard({
  size,
  pattern,
  label,
  playAll = false,
}: GridCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const dotSize = size === 9 ? 5 : size === 5 ? 7 : 8;
  const gap = size === 9 ? 3 : size === 5 ? 3 : 4;

  return (
    <article
      className="bg-(--color-card-bg) border border-(--color-card-border) rounded-xl sm:rounded-2xl p-4 sm:p-6 pb-4 sm:pb-5 flex flex-col items-center justify-between aspect-square transition-colors duration-200 ease hover:border-(--color-card-hover-border) hover:bg-(--color-card-hover-bg)"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex-1 flex items-center justify-center">
        <DotGrid
          size={size}
          pattern={pattern}
          dotSize={dotSize}
          gap={gap}
          baseColor="var(--color-dot)"
          isHovered={playAll || isHovered}
        />
      </div>
      <div className="flex flex-col items-center gap-0.5 sm:gap-1 text-center mt-2 sm:mt-3">
        <span className="text-xs sm:text-sm font-medium text-(--color-foreground) tracking-tight">
          {label}
        </span>
      </div>
    </article>
  );
}
