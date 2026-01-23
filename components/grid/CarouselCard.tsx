"use client";

import { memo } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
import { DotGrid } from "./DotGrid";
import type { GridShowcase } from "./Carousel";
import { useCarouselDimensions } from "@/hooks/useCarouselDimensions";

interface CarouselCardProps {
	showcase: GridShowcase;
	index: number;
	visualCenter: MotionValue<number>;
	onClick: () => void;
}

const VISIBLE_RANGE = 2;

function getScaleFactor(cardWidth: number): number {
	return cardWidth / 400;
}

export const CarouselCard = memo(function CarouselCard({
	showcase,
	index,
	visualCenter,
	onClick,
}: CarouselCardProps) {
	const { cardWidth } = useCarouselDimensions();
	const scaleFactor = getScaleFactor(cardWidth);

	const position = useTransform(visualCenter, (center) => index - center);

	const scale = useTransform(position, (pos) => {
		const absPos = Math.abs(pos);
		if (absPos < 0.5) return 1;
		if (absPos < 1.5) return 0.85 - (absPos - 0.5) * 0.15;
		return 0.7;
	});

	const opacity = useTransform(position, (pos) => {
		const absPos = Math.abs(pos);
		if (absPos < 0.5) return 1;
		if (absPos < 1.5) return 0.7 - (absPos - 0.5) * 0.3;
		return 0.4;
	});

	const zIndex = useTransform(position, (pos) => {
		const absPos = Math.abs(pos);
		if (absPos < 0.5) return 10;
		if (absPos < 1.5) return 5;
		return 1;
	});

	const isVisible = useTransform(position, (pos) => Math.abs(pos) <= VISIBLE_RANGE);

	const baseDotSize = showcase.size === 9 ? 18 : showcase.size === 5 ? 24 : 30;
	const baseGap = showcase.size === 9 ? 10 : showcase.size === 5 ? 12 : 16;

	const dotSize = Math.round(baseDotSize * scaleFactor);
	const gap = Math.round(baseGap * scaleFactor);

	return (
		<motion.div
			className="shrink-0 will-change-transform"
			style={{
				width: "var(--carousel-card-width)",
				height: "var(--carousel-card-width)",
				zIndex,
				scale,
				opacity,
			}}
			onClick={onClick}
			role="group"
			aria-roledescription="slide"
			aria-label={showcase.label}
		>
			<article className="ease flex aspect-square h-full flex-col items-center justify-between rounded-xl border border-(--color-card-border) bg-(--color-card-bg) p-4 pb-4 shadow-sm transition-all duration-200 hover:border-(--color-card-hover-border) hover:bg-(--color-card-hover-bg) hover:shadow-md sm:rounded-2xl sm:p-6 sm:pb-5">
				<div className="flex flex-1 items-center justify-center">
					<DotGrid
						size={showcase.size}
						pattern={showcase.pattern}
						dotSize={dotSize}
						gap={gap}
						baseColor="var(--color-dot)"
						isVisible={isVisible}
					/>
				</div>
				<div className="mt-2 flex flex-col items-center gap-0.5 text-center sm:mt-3 sm:gap-1">
					<span className="text-xs font-medium tracking-tight text-(--color-foreground) sm:text-sm">
						{showcase.label}
					</span>
				</div>
			</article>
		</motion.div>
	);
});
