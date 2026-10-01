"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue } from "motion/react";
import { DotGrid } from "./DotGrid";
import type { PatternName } from "@/lib/patterns";

export type GridShowcase = {
	size: 3 | 5 | 9;
	pattern: PatternName;
	label: string;
};

const dimensions = {
	3: { dotSize: 28, gap: 14 },
	5: { dotSize: 16, gap: 8 },
	9: { dotSize: 8, gap: 5 },
} as const;

function PatternCell({ showcase }: { showcase: GridShowcase }) {
	const ref = useRef<HTMLLIElement>(null);
	const inView = useInView(ref, { margin: "64px" });
	const isVisible = useMotionValue(false);

	useEffect(() => {
		isVisible.set(inView);
	}, [inView, isVisible]);

	return (
		<li ref={ref} className="flex flex-col items-center gap-4">
			<DotGrid
				size={showcase.size}
				pattern={showcase.pattern}
				{...dimensions[showcase.size]}
				isVisible={isVisible}
			/>
			<span className="text-xs tracking-tight text-(--color-text-secondary)">{showcase.label}</span>
		</li>
	);
}

export function PatternGrid({ showcases }: { showcases: GridShowcase[] }) {
	return (
		<ul className="grid grid-cols-2 gap-x-6 gap-y-16 sm:grid-cols-3 lg:grid-cols-4">
			{showcases.map((showcase) => (
				<PatternCell key={showcase.pattern} showcase={showcase} />
			))}
		</ul>
	);
}
