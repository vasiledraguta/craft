"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import {
	animate,
	motion,
	useMotionValue,
	useMotionValueEvent,
	useReducedMotion,
	useSpring,
	useTransform,
	useVelocity,
	type MotionValue,
} from "motion/react";
import { createZipperSound } from "./zipperSound";

const springEase = [0.22, 1, 0.36, 1] as const;

const CENTER_X = 180;
const CENTER_Y = 125;
const SCALE = 6;
const NOTCH_Y = CENTER_Y - 5 * SCALE;
const TIP_Y = CENTER_Y + 17 * SCALE;
const TOOTH_PITCH = 6;
const TOOTH_START = 4;
const TOOTH_END = 14;
const OPEN_KICK = 4;
const OPEN_SPREAD = 0.12;
const BREAK_ANGLE = (9 * Math.PI) / 180;
const BREAK_SHIFT = 4;
const BREAK_DROP = 3;

const TAB_PATH =
	"M-1 0h2a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4ZM0 14a2 2 0 0 1 2 2v4a2 2 0 0 1-4 0v-4a2 2 0 0 1 2-2Z";

type Point = { x: number; y: number };

function heartPoint(t: number): Point {
	const x = 16 * Math.sin(t) ** 3;
	const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
	return { x: CENTER_X + x * SCALE, y: CENTER_Y - y * SCALE };
}

function sampleOutline(from: number, to: number, count: number) {
	return Array.from({ length: count + 1 }, (_, i) => heartPoint(from + ((to - from) * i) / count));
}

const SEAM_LENGTH = TIP_Y - NOTCH_Y;
const SEAM_STEPS = Math.ceil(SEAM_LENGTH / 1.5);

const seam = Array.from({ length: SEAM_STEPS + 1 }, (_, i) => ({
	x: CENTER_X,
	y: NOTCH_Y + (SEAM_LENGTH * i) / SEAM_STEPS,
}));

const outlines = {
	left: [...sampleOutline(Math.PI, 2 * Math.PI, 160), ...seam],
	right: [...sampleOutline(0, Math.PI, 160), ...[...seam].reverse()],
};

const teeth = Array.from(
	{ length: Math.floor((SEAM_LENGTH - TOOTH_START - TOOTH_END) / TOOTH_PITCH) + 1 },
	(_, i) => {
		const y = NOTCH_Y + TOOTH_START + i * TOOTH_PITCH;
		const side = i % 2 === 0 ? -1 : 1;
		const x = CENTER_X + side * 1.5;
		const corners = [
			{ x: x - 4.5, y: y - 2.2 },
			{ x: x + 4.5, y: y - 2.2 },
			{ x: x + 4.5, y: y + 2.2 },
			{ x: x - 4.5, y: y + 2.2 },
		];
		return { side, corners };
	}
);

function deform(point: Point, side: number, sliderY: number, broken: number): Point {
	const u = Math.max(0, sliderY - Math.max(point.y, NOTCH_Y));
	const spread = side * (OPEN_KICK * (1 - Math.exp(-u / 8)) + OPEN_SPREAD * u);
	const x = point.x + spread - CENTER_X;
	const y = point.y - TIP_Y;
	const angle = side * BREAK_ANGLE * broken;
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);
	return {
		x: CENTER_X + x * cos - y * sin + side * BREAK_SHIFT * broken,
		y: TIP_Y + x * sin + y * cos + BREAK_DROP * broken,
	};
}

function toPath(points: Point[]) {
	return (
		points
			.map((point, i) => `${i === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
			.join("") + "Z"
	);
}

function useHalf(side: -1 | 1, sliderY: MotionValue<number>, broken: MotionValue<number>) {
	const outline = side === -1 ? outlines.left : outlines.right;
	const shape = useTransform(() =>
		toPath(outline.map((point) => deform(point, side, sliderY.get(), broken.get())))
	);
	const teethShape = useTransform(() =>
		teeth
			.filter((tooth) => tooth.side === side)
			.map((tooth) =>
				toPath(tooth.corners.map((point) => deform(point, side, sliderY.get(), broken.get())))
			)
			.join("")
	);
	return { shape, teethShape };
}

const keySteps: Record<string, (progress: number) => number> = {
	ArrowDown: (progress) => progress + TOOTH_PITCH / SEAM_LENGTH,
	ArrowRight: (progress) => progress + TOOTH_PITCH / SEAM_LENGTH,
	ArrowUp: (progress) => progress - TOOTH_PITCH / SEAM_LENGTH,
	ArrowLeft: (progress) => progress - TOOTH_PITCH / SEAM_LENGTH,
	PageDown: (progress) => progress + 0.25,
	PageUp: (progress) => progress - 0.25,
	Home: () => 0,
	End: () => 1,
};

export function ZipperHeart() {
	const svgRef = useRef<SVGSVGElement>(null);
	const dragOffset = useRef<number | null>(null);
	const keyTarget = useRef<number | null>(null);
	const lastTooth = useRef(-1);
	const lastProgress = useRef(0);
	const isBroken = useRef(false);
	const [sound] = useState(createZipperSound);
	const [percent, setPercent] = useState(0);
	const prefersReducedMotion = useReducedMotion() ?? false;

	const progress = useMotionValue(0);
	const broken = useMotionValue(0);
	const pulse = useMotionValue(1);

	const pointerX = useMotionValue(0);
	const sliderY = useTransform(progress, (p) => NOTCH_Y + p * SEAM_LENGTH);
	const pointerVelocity = useVelocity(pointerX);
	const rawSwing = useTransform(pointerVelocity, (v) => Math.max(-50, Math.min(50, v * 0.08)));
	const smoothSwing = useSpring(rawSwing, { stiffness: 170, damping: 7 });

	const left = useHalf(-1, sliderY, broken);
	const right = useHalf(1, sliderY, broken);

	useEffect(() => () => sound.dispose(), [sound]);

	useMotionValueEvent(progress, "change", (p) => {
		const tooth = Math.floor((p * SEAM_LENGTH - TOOTH_START) / TOOTH_PITCH);
		if (tooth !== lastTooth.current) {
			sound.tick(tooth < lastTooth.current);
			lastTooth.current = tooth;
		}

		if (p >= 1 && !isBroken.current) {
			isBroken.current = true;
			sound.thump(150);
			animate(
				broken,
				1,
				prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 12 }
			);
		} else if (p < 1 && isBroken.current) {
			isBroken.current = false;
			animate(
				broken,
				0,
				prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 24 }
			);
		}

		if (p <= 0 && lastProgress.current > 0) {
			sound.thump(220);
			if (!prefersReducedMotion) {
				animate(pulse, 1, { type: "spring", stiffness: 500, damping: 10, velocity: 2 });
			}
		}

		lastProgress.current = p;
		setPercent(Math.round(p * 100));
	});

	const toSvgPoint = (event: PointerEvent) => {
		const matrix = svgRef.current?.getScreenCTM();
		if (!matrix) return null;
		return new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
	};

	const onPointerDown = (event: PointerEvent<SVGGElement>) => {
		const point = toSvgPoint(event);
		if (!point) return;
		event.currentTarget.setPointerCapture(event.pointerId);
		sound.unlock();
		progress.stop();
		keyTarget.current = null;
		pointerX.jump(point.x);
		dragOffset.current = point.y - sliderY.get();
	};

	const onPointerMove = (event: PointerEvent<SVGGElement>) => {
		if (dragOffset.current === null) return;
		const point = toSvgPoint(event);
		if (!point) return;
		pointerX.set(point.x);
		progress.set(Math.max(0, Math.min(1, (point.y - dragOffset.current - NOTCH_Y) / SEAM_LENGTH)));
	};

	const onPointerEnd = () => {
		dragOffset.current = null;
	};

	const onKeyDown = (event: KeyboardEvent<SVGGElement>) => {
		const step = keySteps[event.key];
		if (!step) return;
		event.preventDefault();
		sound.unlock();
		const target = Math.max(0, Math.min(1, step(keyTarget.current ?? progress.get())));
		keyTarget.current = target;
		animate(progress, target, {
			duration: prefersReducedMotion ? 0 : 0.2,
			ease: springEase,
			onComplete: () => {
				keyTarget.current = null;
			},
		});
	};

	const valueText =
		percent === 0
			? "Zipped, heart whole"
			: percent === 100
				? "Unzipped, heart broken"
				: `${percent}% unzipped`;

	return (
		<div className="my-auto flex w-full flex-col items-center gap-6">
			<h1 className="sr-only">Zipper Heart</h1>
			<svg ref={svgRef} viewBox="0 0 360 300" className="w-full max-w-sm overflow-visible">
				<motion.g aria-hidden style={{ scale: pulse }}>
					<motion.path
						d={left.shape}
						strokeWidth={1.5}
						strokeLinejoin="round"
						className="fill-(--color-surface) stroke-(--color-border-hover)"
					/>
					<motion.path
						d={right.shape}
						strokeWidth={1.5}
						strokeLinejoin="round"
						className="fill-(--color-surface) stroke-(--color-border-hover)"
					/>
					<motion.path
						d={left.teethShape}
						strokeWidth={1}
						strokeLinejoin="round"
						className="fill-(--color-text-tertiary) stroke-(--color-text-tertiary)"
					/>
					<motion.path
						d={right.teethShape}
						strokeWidth={1}
						strokeLinejoin="round"
						className="fill-(--color-text-tertiary) stroke-(--color-text-tertiary)"
					/>
				</motion.g>
				<motion.g style={{ x: CENTER_X, y: sliderY }}>
					<motion.g
						role="slider"
						tabIndex={0}
						aria-label="Zipper"
						aria-orientation="vertical"
						aria-valuemin={0}
						aria-valuemax={100}
						aria-valuenow={percent}
						aria-valuetext={valueText}
						onPointerDown={onPointerDown}
						onPointerMove={onPointerMove}
						onPointerUp={onPointerEnd}
						onPointerCancel={onPointerEnd}
						onKeyDown={onKeyDown}
						whileHover={{ scale: 1.08 }}
						whileTap={{ scale: 0.94 }}
						transition={{ duration: 0.2, ease: springEase }}
						className="group cursor-grab touch-none outline-none active:cursor-grabbing"
					>
						<circle cy={8} r={24} fill="transparent" />
						<circle
							cy={8}
							r={22}
							fill="none"
							strokeWidth={2}
							className="stroke-(--color-text-tertiary) opacity-0 transition-opacity duration-200 group-focus-visible:opacity-100"
						/>
						<rect
							x={-7}
							y={-10}
							width={14}
							height={20}
							rx={5}
							strokeWidth={1.5}
							className="fill-(--color-surface) stroke-(--color-text-tertiary)"
						/>
						<motion.path
							d={TAB_PATH}
							fillRule="evenodd"
							strokeWidth={1.5}
							style={{ rotate: prefersReducedMotion ? 0 : smoothSwing, originX: 0.5, originY: 0 }}
							className="fill-(--color-surface) stroke-(--color-text-tertiary)"
						/>
					</motion.g>
				</motion.g>
			</svg>
			<p className="text-sm text-(--color-text-tertiary)">Drag the zipper</p>
		</div>
	);
}
