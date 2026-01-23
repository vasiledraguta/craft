"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
	motion,
	useMotionValue,
	useTransform,
	animate,
	type PanInfo,
	type AnimationPlaybackControls,
} from "motion/react";
import { CarouselCard } from "./CarouselCard";
import type { PatternName } from "@/lib/patterns";
import { useCarouselDimensions } from "@/hooks/useCarouselDimensions";

export type GridShowcase = {
	size: 3 | 5 | 9;
	pattern: PatternName;
	label: string;
};

interface CarouselProps {
	showcases: GridShowcase[];
}

const CLONE_COUNT = 3;

export function Carousel({ showcases }: CarouselProps) {
	const totalItems = showcases.length;
	const [activeIndex, setActiveIndex] = useState(CLONE_COUNT);
	const [isDragging, setIsDragging] = useState(false);

	const { itemSize } = useCarouselDimensions();

	const scrollX = useMotionValue(-activeIndex * itemSize);
	const animationRef = useRef<AnimationPlaybackControls | null>(null);

	const virtualItems = useMemo(() => {
		const createItem = (item: GridShowcase, index: number, isClone: boolean) => ({
			...item,
			isClone,
			originalIndex: index,
		});
		return [
			...showcases
				.slice(-CLONE_COUNT)
				.map((item, i) => createItem(item, totalItems - CLONE_COUNT + i, true)),
			...showcases.map((item, i) => createItem(item, i, false)),
			...showcases.slice(0, CLONE_COUNT).map((item, i) => createItem(item, i, true)),
		];
	}, [showcases, totalItems]);

	const snapToCard = useCallback(
		(index: number, immediate = false) => {
			const target = -index * itemSize;
			if (animationRef.current) animationRef.current.stop();

			if (immediate) {
				scrollX.set(target);
			} else {
				animationRef.current = animate(scrollX, target, {
					type: "spring",
					stiffness: 300,
					damping: 30,
				});
			}
		},
		[scrollX, itemSize]
	);

	const visualCenter = useTransform(scrollX, (x) => -x / itemSize);

	const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
		setIsDragging(false);
		const velocity = info.velocity.x;
		const offset = info.offset.x;

		let direction = 0;

		const dragThreshold = itemSize * 0.25;
		const velocityThreshold = 300;

		if (Math.abs(offset) > dragThreshold || Math.abs(velocity) > velocityThreshold) {
			if (Math.abs(velocity) > velocityThreshold) {
				direction = velocity > 0 ? -1 : 1;
			} else {
				direction = offset > 0 ? -1 : 1;
			}
		}

		const target = Math.max(0, Math.min(virtualItems.length - 1, activeIndex + direction));
		setActiveIndex(target);
		snapToCard(target);
	};

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
				e.preventDefault();
				const direction = e.key === "ArrowRight" ? 1 : -1;
				const next = activeIndex + direction;
				const clamped = Math.max(0, Math.min(virtualItems.length - 1, next));
				setActiveIndex(clamped);
				snapToCard(clamped);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [activeIndex, virtualItems.length, snapToCard]);

	useEffect(() => {
		if (isDragging) return;

		const isStartClone = activeIndex < CLONE_COUNT;
		const isEndClone = activeIndex >= totalItems + CLONE_COUNT;

		if (isStartClone || isEndClone) {
			const timer = setTimeout(() => {
				const realIndex = isStartClone ? activeIndex + totalItems : activeIndex - totalItems;

				setActiveIndex(realIndex);
				snapToCard(realIndex, true);
			}, 250);
			return () => clearTimeout(timer);
		}
	}, [activeIndex, isDragging, totalItems, snapToCard]);

	const prevItemSizeRef = useRef(itemSize);
	useEffect(() => {
		if (prevItemSizeRef.current !== itemSize) {
			prevItemSizeRef.current = itemSize;
			if (!isDragging) {
				scrollX.set(-activeIndex * itemSize);
			}
		}
	}, [itemSize, activeIndex, isDragging, scrollX]);

	return (
		<div
			className="relative w-full overflow-hidden py-12"
			role="region"
			aria-label="Pattern carousel"
			tabIndex={0}
		>
			<motion.div
				className="flex cursor-grab items-center active:cursor-grabbing"
				style={{
					x: scrollX,
					gap: "var(--carousel-gap)",
					paddingLeft: "calc(50vw - var(--carousel-card-width) / 2)",
					paddingRight: "calc(50vw - var(--carousel-card-width) / 2)",
				}}
				drag="x"
				dragConstraints={{
					left: -(virtualItems.length - 1) * itemSize,
					right: 0,
				}}
				dragElastic={0.1}
				onDragStart={() => setIsDragging(true)}
				onDragEnd={handleDragEnd}
			>
				{virtualItems.map((item, i) => (
					<CarouselCard
						key={`${item.pattern}-${i}`}
						showcase={item}
						index={i}
						visualCenter={visualCenter}
						onClick={() => {
							setActiveIndex(i);
							snapToCard(i);
						}}
					/>
				))}
			</motion.div>
		</div>
	);
}
