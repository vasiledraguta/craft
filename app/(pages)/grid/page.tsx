"use client";

import { Carousel } from "@/components/grid/Carousel";
import Source from "@/components/Source";
import type { PatternName } from "@/lib/patterns";

type GridShowcase = {
	size: 3 | 5 | 9;
	pattern: PatternName;
	label: string;
};

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
	return (
		<div className="relative flex min-h-screen items-center justify-center bg-[--color-background]">
			<Carousel showcases={showcases} />
			<div className="absolute bottom-4">
				<Source href="https://github.com/vasiledraguta/craft/tree/main/components/grid" />
			</div>
		</div>
	);
}
