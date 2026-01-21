"use client";

import { useState } from "react";
import { GridCard } from "@/components/grid/GridCard";
import { PlayModeToggle } from "@/components/grid/PlayModeToggle";
import type { PatternName } from "@/lib/patterns";
import { Links } from "@/components/Links";

type GridShowcase = {
  size: 3 | 5 | 9;
  pattern: PatternName;
  label: string;
};

type PlayMode = "hover" | "all";

const showcases: GridShowcase[] = [
  // 3x3 grids
  { size: 3, pattern: "pulse", label: "Pulse" },
  { size: 3, pattern: "checkerboard", label: "Checkerboard" },
  { size: 3, pattern: "stagger", label: "Stagger" },
  { size: 3, pattern: "fibonacci", label: "Fibonacci Spiral" },
  { size: 3, pattern: "waveInterference", label: "Wave Interference" },
  { size: 3, pattern: "gravityWells", label: "Gravity Wells" },
  { size: 3, pattern: "kaleidoscope", label: "Kaleidoscope" },
  { size: 3, pattern: "quantum", label: "Quantum" },
  // 5x5 grids
  { size: 5, pattern: "wave", label: "Wave" },
  { size: 5, pattern: "ripple", label: "Ripple" },
  { size: 5, pattern: "snake", label: "Snake" },
  { size: 5, pattern: "heartbeat", label: "Heartbeat" },
  { size: 5, pattern: "cross", label: "Cross" },
  { size: 5, pattern: "diamond", label: "Diamond" },
  { size: 5, pattern: "radar", label: "Radar" },
  // 9x9 grids
  { size: 9, pattern: "cascade", label: "Cascade" },
  { size: 9, pattern: "waveDiagonal", label: "Wave Diagonal" },
  { size: 9, pattern: "rain", label: "Rain" },
  { size: 9, pattern: "orbit", label: "Orbit" },
  { size: 9, pattern: "corners", label: "Corners" },
  { size: 9, pattern: "scan", label: "Scan" },
  { size: 9, pattern: "dna", label: "DNA" },
  { size: 9, pattern: "pinwheel", label: "Pinwheel" },
  { size: 9, pattern: "perlinFlow", label: "Perlin Flow" },
];

export default function GridPage() {
  const [playMode, setPlayMode] = useState<PlayMode>("hover");

  return (
    <div className="min-h-screen bg-[--color-background]">
      <header className="flex flex-col items-center px-6 pt-8 pb-12 sm:pb-16">
        <h1 className="text-2xl sm:text-3xl tracking-tight text-(--color-foreground)">
          Dot Grid Patterns
        </h1>
        <p className="text-sm sm:text-base text-[--color-text-secondary] mt-3">
          Programmatic animations on small grids
        </p>

        <Links align="left" />

        <div className="mt-6">
          <PlayModeToggle value={playMode} onChange={setPlayMode} />
        </div>
      </header>

      <main className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 max-w-[1400px] mx-auto px-4 sm:px-8 pb-12 sm:pb-20">
        {showcases.map((item) => (
          <GridCard
            key={`${item.size}-${item.pattern}`}
            size={item.size}
            pattern={item.pattern}
            label={item.label}
            playAll={playMode === "all"}
          />
        ))}
      </main>
    </div>
  );
}
