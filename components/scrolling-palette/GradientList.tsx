"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import type { GradientDefinition } from "@/lib/gradients";

interface GradientListProps {
	gradients: GradientDefinition[];
	activeIndex: number;
	scrollIndex: MotionValue<number>;
}

interface GradientItemProps {
	gradient: GradientDefinition;
	index: number;
	scrollIndex: MotionValue<number>;
}

function GradientItem({ gradient, index, scrollIndex }: GradientItemProps) {
	const scale = useTransform(scrollIndex, (latest) => {
		const distance = Math.abs(index - latest);
		const intensity = Math.exp(-distance * distance * 2.5);
		return 0.85 + intensity * 0.15;
	});

	const opacity = useTransform(scrollIndex, (latest) => {
		const distance = Math.abs(index - latest);
		const intensity = Math.exp(-distance * distance * 3);
		// Interpolate from 0.3 to 1
		return 0.3 + intensity * 0.7;
	});

	const x = useTransform(scrollIndex, (latest) => {
		const distance = Math.abs(index - latest);
		return Math.exp(-distance * distance * 3) * 12;
	});

	return (
		<motion.div className="relative origin-left" style={{ scale, x }}>
			<motion.span
				className="block font-serif text-xl leading-[1.02] font-medium tracking-[-0.018em] text-(--color-foreground) sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl"
				style={{ opacity }}
			>
				{gradient.name}
			</motion.span>
		</motion.div>
	);
}

export function GradientList({ gradients, scrollIndex }: GradientListProps) {
	return (
		<div className="flex flex-col gap-0.5 sm:gap-1 md:gap-2">
			{gradients.map((gradient, index) => (
				<GradientItem
					key={gradient.id}
					gradient={gradient}
					index={index}
					scrollIndex={scrollIndex}
				/>
			))}
		</div>
	);
}
