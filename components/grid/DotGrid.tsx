'use client';

import { memo, useEffect, useMemo, useRef } from 'react';
import { useReducedMotion, type MotionValue } from 'motion/react';
import { patterns, type PatternName } from '@/lib/patterns';

interface DotGridProps {
	size: 3 | 5 | 9;
	pattern: PatternName;
	dotSize?: number;
	gap?: number;
	baseColor?: string;
	isVisible?: MotionValue<boolean>;
}

const IDLE_OPACITY = 0.25;
const IDLE_SCALE = 0.7;

const SMOOTHING = 0.12;
const ANIMATION_SPEED = 1;

export const DotGrid = memo(function DotGrid({
	size,
	pattern,
	dotSize = 8,
	gap = 6,
	baseColor = 'var(--color-dot)',
	isVisible,
}: DotGridProps) {
	const prefersReducedMotion = useReducedMotion() ?? false;
	const patternFn = patterns[pattern];
	const dotRefs = useRef<Array<HTMLDivElement | null>>([]);
	const valuesRef = useRef<Array<{ opacity: number; scale: number }>>([]);
	const gridSize = size * dotSize + (size - 1) * gap;

	const dotIndices = useMemo(
		() => Array.from({ length: size * size }, (_, i) => i),
		[size],
	);
	const coordinates = useMemo(
		() => dotIndices.map((index) => [Math.floor(index / size), index % size]),
		[dotIndices, size],
	);

	useEffect(() => {
		const dots = dotRefs.current;
		if (valuesRef.current.length !== coordinates.length) {
			valuesRef.current = coordinates.map(() => ({
				opacity: IDLE_OPACITY,
				scale: IDLE_SCALE,
			}));
		}

		const setIdle = () => {
			dots.forEach((dot, i) => {
				if (!dot) return;
				const values = valuesRef.current[i];
				values.opacity = IDLE_OPACITY;
				values.scale = IDLE_SCALE;
				dot.style.opacity = String(IDLE_OPACITY);
				dot.style.transform = `scale(${IDLE_SCALE})`;
			});
		};

		if (prefersReducedMotion) {
			setIdle();
			return;
		}

		let frameId: number;
		const animate = (time: number) => {
			const visible = isVisible?.get() ?? true;
			
			if (!visible) {
				setIdle();
				frameId = requestAnimationFrame(animate);
				return;
			}

			const t = (time / 1000) * ANIMATION_SPEED;
			coordinates.forEach(([row, col], i) => {
				const dot = dots[i];
				if (!dot) return;
				const result = patternFn(row, col, size, t);
				const values = valuesRef.current[i];
				values.opacity += (result.opacity - values.opacity) * SMOOTHING;
				values.scale += (result.scale - values.scale) * SMOOTHING;
				dot.style.opacity = values.opacity.toFixed(3);
				dot.style.transform = `scale(${values.scale.toFixed(3)})`;
			});
			frameId = requestAnimationFrame(animate);
		};

		frameId = requestAnimationFrame(animate);
		return () => cancelAnimationFrame(frameId);
	}, [coordinates, isVisible, patternFn, prefersReducedMotion, size]);

	return (
		<div
			className='dot-grid'
			style={{
				display: 'grid',
				gridTemplateColumns: `repeat(${size}, ${dotSize}px)`,
				gap: `${gap}px`,
				width: gridSize,
				height: gridSize,
			}}
		>
			{dotIndices.map((index) => (
				<div
					key={index}
					ref={(el) => {
						dotRefs.current[index] = el;
					}}
					className='dot'
					style={{
						width: dotSize,
						height: dotSize,
						borderRadius: '50%',
						backgroundColor: baseColor,
						opacity: IDLE_OPACITY,
						transform: `scale(${IDLE_SCALE})`,
						willChange: 'transform, opacity',
					}}
				/>
			))}
		</div>
	);
});
