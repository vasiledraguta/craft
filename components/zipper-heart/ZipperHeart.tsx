"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import {
	AnimatePresence,
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
const SEAM_LENGTH = TIP_Y - NOTCH_Y;
const SEAM_STEPS = Math.ceil(SEAM_LENGTH / 1.5);
const TOOTH_PITCH = 6;
const TOOTH_START = 4;
const TOOTH_END = 14;
const TAPE_WIDTH = 8;
const STITCH_OFFSET = 11;
const STITCH_INSET = 0.92;
const OPEN_KICK = 4;
const OPEN_SPREAD = 0.12;
const BREAK_ANGLE = (9 * Math.PI) / 180;
const BREAK_SHIFT = 4;
const BREAK_DROP = 3;
const RUBBER = 0.12;

const SLIDER_PATH =
	"M-7 -12H7Q11 -12 10.5 -8L8.5 8Q8 12 4 12H-4Q-8 12 -8.5 8L-10.5 -8Q-11 -12 -7 -12Z";
const TAB_PATH =
	"M-3 0H3A3 3 0 0 1 6 3V29A5 5 0 0 1 1 34H-1A5 5 0 0 1-6 29V3A3 3 0 0 1-3 0ZM-2 4.5H2A1.5 1.5 0 0 1 3.5 6V10A1.5 1.5 0 0 1 2 11.5H-2A1.5 1.5 0 0 1-3.5 10V6A1.5 1.5 0 0 1-2 4.5Z";

type Point = { x: number; y: number };
type Side = -1 | 1;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function heartPoint(t: number): Point {
	const x = 16 * Math.sin(t) ** 3;
	const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
	return { x: CENTER_X + x * SCALE, y: CENTER_Y - y * SCALE };
}

function sampleOutline(from: number, to: number, count: number) {
	return Array.from({ length: count + 1 }, (_, i) => heartPoint(from + ((to - from) * i) / count));
}

const shift = (points: Point[], dx: number) =>
	points.map((point) => ({ x: point.x + dx, y: point.y }));

const seam = Array.from({ length: SEAM_STEPS + 1 }, (_, i) => ({
	x: CENTER_X,
	y: NOTCH_Y + (SEAM_LENGTH * i) / SEAM_STEPS,
}));

const teeth = Array.from(
	{ length: Math.floor((SEAM_LENGTH - TOOTH_START - TOOTH_END) / TOOTH_PITCH) + 1 },
	(_, i) => {
		const y = NOTCH_Y + TOOTH_START + i * TOOTH_PITCH;
		const side: Side = i % 2 === 0 ? -1 : 1;
		const x = CENTER_X + side * 1.5;
		return {
			side,
			corners: [
				{ x: x - 4.5, y: y - 2.2 },
				{ x: x + 4.5, y: y - 2.2 },
				{ x: x + 4.5, y: y + 2.2 },
				{ x: x - 4.5, y: y + 2.2 },
			],
			shine: [
				{ x: x - 3.4, y: y - 1.2 },
				{ x: x + 3.4, y: y - 1.2 },
			],
		};
	}
);

function buildHalf(side: Side) {
	const outline =
		side === -1 ? sampleOutline(Math.PI, 2 * Math.PI, 160) : sampleOutline(0, Math.PI, 160);
	const stitchCenter = { x: CENTER_X, y: CENTER_Y + 2 * SCALE };
	return {
		shape: [...outline, ...(side === -1 ? seam : [...seam].reverse())],
		tape: [...seam, ...shift([...seam].reverse(), side * TAPE_WIDTH)],
		seamStitch: shift(seam, side * STITCH_OFFSET),
		outlineStitch: outline
			.map((point) => ({
				x: stitchCenter.x + (point.x - stitchCenter.x) * STITCH_INSET,
				y: stitchCenter.y + (point.y - stitchCenter.y) * STITCH_INSET,
			}))
			.filter((point) => Math.abs(point.x - CENTER_X) >= STITCH_OFFSET + 3),
		teeth: teeth.filter((tooth) => tooth.side === side),
	};
}

const halves = { left: buildHalf(-1), right: buildHalf(1) };

function deform(point: Point, side: Side, sliderY: number, broken: number, flare: number): Point {
	const u = Math.max(0, sliderY - Math.max(point.y, NOTCH_Y));
	const spread = side * (OPEN_KICK * (1 - Math.exp(-u / 8)) + OPEN_SPREAD * (1 + flare) * u);
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

function toLine(points: Point[]) {
	return points
		.map((point, i) => `${i === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
		.join("");
}

function rubberband(value: number) {
	if (value >= 0 && value <= 1) return value;
	const over = value < 0 ? value : value - 1;
	const damped = (over * RUBBER * 0.55) / (RUBBER + 0.55 * Math.abs(over));
	return value < 0 ? damped : 1 + damped;
}

function useHalf(
	side: Side,
	sliderY: MotionValue<number>,
	broken: MotionValue<number>,
	flare: MotionValue<number>
) {
	const half = side === -1 ? halves.left : halves.right;
	const project = () => {
		const y = sliderY.get();
		const b = broken.get();
		const f = flare.get();
		return (points: Point[]) => points.map((point) => deform(point, side, y, b, f));
	};
	const shape = useTransform(() => toLine(project()(half.shape)) + "Z");
	const tape = useTransform(() => toLine(project()(half.tape)) + "Z");
	const stitches = useTransform(() => {
		const map = project();
		return toLine(map(half.seamStitch)) + toLine(map(half.outlineStitch));
	});
	const teethShape = useTransform(() => {
		const map = project();
		return half.teeth.map((tooth) => toLine(map(tooth.corners)) + "Z").join("");
	});
	const teethShine = useTransform(() => {
		const map = project();
		return half.teeth.map((tooth) => toLine(map(tooth.shine))).join("");
	});
	return { shape, tape, stitches, teethShape, teethShine };
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
	const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
	const svgRef = useRef<SVGSVGElement>(null);
	const activePointer = useRef<number | null>(null);
	const dragOffset = useRef(0);
	const keyTarget = useRef<number | null>(null);
	const lastTooth = useRef(-1);
	const healArmed = useRef(false);
	const isBroken = useRef(false);
	const [sound] = useState(createZipperSound);
	const [percent, setPercent] = useState(0);
	const [hasBroken, setHasBroken] = useState(false);
	const prefersReducedMotion = useReducedMotion() ?? false;

	const progress = useMotionValue(0);
	const broken = useMotionValue(0);
	const pulse = useMotionValue(1);
	const still = useMotionValue(0);
	const tabTarget = useMotionValue(0);

	const sliderY = useTransform(progress, (p) => NOTCH_Y + p * SEAM_LENGTH);
	const progressVelocity = useVelocity(progress);
	const flareTarget = useTransform(progressVelocity, (v) => Math.min(0.6, Math.abs(v) * 0.12));
	const flare = useSpring(flareTarget, { stiffness: 180, damping: 11 });
	const tabAngle = useSpring(tabTarget, { stiffness: 240, damping: 9 });

	const left = useHalf(-1, sliderY, broken, prefersReducedMotion ? still : flare);
	const right = useHalf(1, sliderY, broken, prefersReducedMotion ? still : flare);

	useEffect(() => () => sound.dispose(), [sound]);

	useEffect(() => {
		if (prefersReducedMotion) return;
		const controls = animate(progress, [0, 0.07, 0], {
			duration: 1.1,
			delay: 0.9,
			ease: springEase,
		});
		return () => controls.stop();
	}, [progress, prefersReducedMotion]);

	useMotionValueEvent(progress, "change", (p) => {
		const tooth = Math.floor((clamp(p, 0, 1) * SEAM_LENGTH - TOOTH_START) / TOOTH_PITCH);
		if (tooth !== lastTooth.current) {
			sound.tick(tooth < lastTooth.current, Math.abs(progressVelocity.get()));
			lastTooth.current = tooth;
		}

		if (p >= 1 && !isBroken.current) {
			isBroken.current = true;
			setHasBroken(true);
			sound.snap();
			animate(
				broken,
				1,
				prefersReducedMotion ? { duration: 0 } : { type: "spring", bounce: 0.35, duration: 0.6 }
			);
		} else if (p < 0.985 && isBroken.current) {
			isBroken.current = false;
			animate(
				broken,
				0,
				prefersReducedMotion ? { duration: 0 } : { type: "spring", bounce: 0, duration: 0.4 }
			);
		}

		if (p > 0.15) healArmed.current = true;
		if (p <= 0 && healArmed.current) {
			healArmed.current = false;
			setHasBroken(false);
			sound.heartbeat();
			if (!prefersReducedMotion) {
				animate(pulse, [pulse.get(), 1.05, 0.99, 1.03, 1], {
					duration: 0.7,
					times: [0, 0.18, 0.36, 0.52, 1],
					ease: springEase,
				});
			}
		}

		setPercent(Math.round(clamp(p, 0, 1) * 100));
	});

	const toSvgPoint = (event: PointerEvent) => {
		const matrix = svgRef.current?.getScreenCTM();
		if (!matrix) return null;
		return new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
	};

	const onPointerDown = (event: PointerEvent<SVGGElement>) => {
		if (activePointer.current !== null) return;
		const point = toSvgPoint(event);
		if (!point) return;
		event.currentTarget.setPointerCapture(event.pointerId);
		activePointer.current = event.pointerId;
		sound.unlock();
		progress.stop();
		keyTarget.current = null;
		dragOffset.current = point.y - sliderY.get();
	};

	const onPointerMove = (event: PointerEvent<SVGGElement>) => {
		if (activePointer.current !== event.pointerId) return;
		const point = toSvgPoint(event);
		if (!point) return;
		progress.set(rubberband((point.y - dragOffset.current - NOTCH_Y) / SEAM_LENGTH));
		const reach = Math.max(24, point.y - sliderY.get() + 4);
		tabTarget.set(clamp((-Math.atan2(point.x - CENTER_X, reach) * 180) / Math.PI, -55, 55));
	};

	const onPointerEnd = (event: PointerEvent<SVGGElement>) => {
		if (activePointer.current !== event.pointerId) return;
		activePointer.current = null;
		tabTarget.set(0);
		const p = progress.get();
		const velocity = clamp(progressVelocity.get(), -6, 6);
		if (prefersReducedMotion) {
			if (p < 0 || p > 1) animate(progress, clamp(p, 0, 1), { duration: 0.2, ease: springEase });
			return;
		}
		if (p < 0 || p > 1) {
			animate(progress, clamp(p, 0, 1), { type: "spring", velocity, bounce: 0, duration: 0.4 });
		} else if (Math.abs(velocity) > 0.4) {
			animate(progress, p, {
				type: "inertia",
				velocity,
				power: 0.12,
				timeConstant: 200,
				min: 0,
				max: 1,
				bounceStiffness: 400,
				bounceDamping: 40,
				restDelta: 0.0005,
				restSpeed: 0.01,
			});
		}
	};

	const onKeyDown = (event: KeyboardEvent<SVGGElement>) => {
		const step = keySteps[event.key];
		if (!step) return;
		event.preventDefault();
		sound.unlock();
		const target = clamp(step(keyTarget.current ?? progress.get()), 0, 1);
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
	const hint = hasBroken ? "Zip it back up" : "Pull the zipper down";

	return (
		<div className="my-auto flex w-full flex-col items-center gap-6">
			<h1 className="sr-only">Zipper Heart</h1>
			<motion.div
				className="w-full max-w-sm"
				initial={prefersReducedMotion ? false : { opacity: 0, y: 8, filter: "blur(4px)" }}
				animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
				transition={{ duration: 0.6, ease: springEase }}
			>
				<svg ref={svgRef} viewBox="0 0 360 300" className="w-full overflow-visible">
					<defs>
						<linearGradient id={`${id}-heart`} x1="0" y1="0" x2="0" y2="1">
							<stop offset="0" style={{ stopColor: "var(--color-heart)" }} />
							<stop offset="1" style={{ stopColor: "var(--color-heart-shade)" }} />
						</linearGradient>
						<linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="0">
							<stop offset="0" style={{ stopColor: "var(--color-metal-shade)" }} />
							<stop offset="0.3" style={{ stopColor: "var(--color-metal-highlight)" }} />
							<stop offset="0.55" style={{ stopColor: "var(--color-metal)" }} />
							<stop offset="1" style={{ stopColor: "var(--color-metal-shade)" }} />
						</linearGradient>
						<filter id={`${id}-shadow`} x="-30%" y="-30%" width="160%" height="170%">
							<feDropShadow
								dx="0"
								dy="14"
								stdDeviation="14"
								style={{ floodColor: "var(--color-heart-shadow)" }}
							/>
						</filter>
						<filter id={`${id}-lift`} x="-50%" y="-50%" width="200%" height="200%">
							<feDropShadow
								dx="0"
								dy="2"
								stdDeviation="2"
								style={{ floodColor: "var(--color-heart-shadow)" }}
							/>
						</filter>
						<clipPath id={`${id}-left`}>
							<motion.path d={left.shape} />
						</clipPath>
						<clipPath id={`${id}-right`}>
							<motion.path d={right.shape} />
						</clipPath>
					</defs>
					<motion.g aria-hidden style={{ scale: pulse }}>
						<g filter={`url(#${id}-shadow)`}>
							{[left, right].map((half, i) => (
								<motion.path
									key={i}
									d={half.shape}
									fill={`url(#${id}-heart)`}
									strokeWidth={1}
									strokeLinejoin="round"
									className="stroke-(--color-border)"
								/>
							))}
						</g>
						{[left, right].map((half, i) => (
							<g key={i} clipPath={`url(#${id}-${i === 0 ? "left" : "right"})`}>
								<motion.path d={half.tape} className="fill-(--color-heart-tape)" />
								<motion.path
									d={half.stitches}
									fill="none"
									strokeWidth={1}
									strokeDasharray="3 2.5"
									strokeLinecap="round"
									className="stroke-(--color-heart-stitch)"
								/>
							</g>
						))}
						{[left, right].map((half, i) => (
							<g key={i}>
								<motion.path
									d={half.teethShape}
									strokeWidth={0.75}
									strokeLinejoin="round"
									className="fill-(--color-metal) stroke-(--color-metal-shade)"
								/>
								<motion.path
									d={half.teethShine}
									fill="none"
									strokeWidth={0.8}
									strokeLinecap="round"
									className="stroke-(--color-metal-highlight)"
								/>
							</g>
						))}
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
							whileHover={{ scale: 1.04 }}
							whileTap={{ scale: 0.97 }}
							transition={{ duration: 0.16, ease: springEase }}
							className="group cursor-grab touch-none outline-none active:cursor-grabbing"
						>
							<rect x={-22} y={-22} width={44} height={66} rx={22} fill="transparent" />
							<rect
								x={-22}
								y={-22}
								width={44}
								height={66}
								rx={22}
								fill="none"
								strokeWidth={1.5}
								className="stroke-(--color-text-tertiary) opacity-0 transition-opacity duration-200 group-focus-visible:opacity-100"
							/>
							<g filter={`url(#${id}-lift)`}>
								<path
									d={SLIDER_PATH}
									fill={`url(#${id}-metal)`}
									strokeWidth={0.75}
									className="stroke-(--color-metal-shade)"
								/>
								<path
									d="M-6 -10.5H6"
									strokeWidth={1}
									strokeLinecap="round"
									className="stroke-(--color-metal-highlight)"
								/>
								<rect
									x={-3}
									y={-9}
									width={6}
									height={10}
									rx={2.5}
									className="fill-(--color-metal-shade)"
								/>
								<g transform="translate(0 -4)">
									<motion.g
										style={{
											rotate: prefersReducedMotion ? 0 : tabAngle,
											originX: 0.5,
											originY: 0,
										}}
									>
										<path
											d={TAB_PATH}
											fillRule="evenodd"
											fill={`url(#${id}-metal)`}
											strokeWidth={0.75}
											className="stroke-(--color-metal-shade)"
										/>
										<path
											d="M0 17V28"
											strokeWidth={1.5}
											strokeLinecap="round"
											className="stroke-(--color-metal-shade)"
										/>
									</motion.g>
								</g>
							</g>
						</motion.g>
					</motion.g>
				</svg>
			</motion.div>
			<AnimatePresence mode="wait" initial={false}>
				<motion.p
					key={hint}
					initial={{ opacity: 0, filter: "blur(2px)" }}
					animate={{ opacity: 1, filter: "blur(0px)" }}
					exit={{ opacity: 0, filter: "blur(2px)" }}
					transition={{ duration: 0.2, ease: springEase }}
					className="text-sm text-(--color-text-tertiary)"
				>
					{hint}
				</motion.p>
			</AnimatePresence>
		</div>
	);
}
