'use client';

import { memo } from 'react';
import { motion, useTransform, type MotionValue } from 'motion/react';
import { DotGrid } from './DotGrid';
import type { GridShowcase } from './Carousel';
import { useCarouselDimensions } from '@/hooks/useCarouselDimensions';

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
			className='shrink-0 will-change-transform'
			style={{
				width: 'var(--carousel-card-width)',
				height: 'var(--carousel-card-width)',
				zIndex,
				scale,
				opacity,
			}}
			onClick={onClick}
			role='group'
			aria-roledescription='slide'
			aria-label={showcase.label}
		>
			<article className='bg-(--color-card-bg) border border-(--color-card-border) rounded-xl sm:rounded-2xl p-4 sm:p-6 pb-4 sm:pb-5 flex flex-col items-center justify-between aspect-square shadow-sm transition-all duration-200 ease hover:border-(--color-card-hover-border) hover:bg-(--color-card-hover-bg) hover:shadow-md h-full'>
				<div className='flex-1 flex items-center justify-center'>
					<DotGrid
						size={showcase.size}
						pattern={showcase.pattern}
						dotSize={dotSize}
						gap={gap}
						baseColor='var(--color-dot)'
						isVisible={isVisible}
					/>
				</div>
				<div className='flex flex-col items-center gap-0.5 sm:gap-1 text-center mt-2 sm:mt-3'>
					<span className='text-xs sm:text-sm font-medium text-(--color-foreground) tracking-tight'>
						{showcase.label}
					</span>
				</div>
			</article>
		</motion.div>
	);
});
