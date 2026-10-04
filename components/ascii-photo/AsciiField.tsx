"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

const RAMP = " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
const FONT_FAMILY = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';
const CHAR_ASPECT = 0.6;
const MAX_HEIGHT_RATIO = 0.75;
const CLIP = 0.01;
const SHARPEN = 0.7;

const RADIUS = 90;
const PUSH = 3.2;
const SPRING = 0.045;
const DAMPING = 0.86;
const SCATTER = 48;
const REST = 0.01;

const RIPPLE_SPEED = 7;
const RIPPLE_WIDTH = 36;
const RIPPLE_FORCE = 2.4;
const RIPPLE_DECAY = 0.985;

interface AsciiFieldProps {
	image: ImageBitmap;
	label: string;
}

type Ramp = {
	chars: string;
	lookup: Uint8Array;
};

type Ripple = {
	x: number;
	y: number;
	radius: number;
	strength: number;
};

type Field = {
	count: number;
	homeX: Float32Array;
	homeY: Float32Array;
	x: Float32Array;
	y: Float32Array;
	vx: Float32Array;
	vy: Float32Array;
	glyph: Uint8Array;
	luminance: Float32Array;
};

function sampleLuminance(image: ImageBitmap, cols: number, rows: number): Float32Array {
	const canvas = document.createElement("canvas");
	canvas.width = cols;
	canvas.height = rows;
	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	const luminance = new Float32Array(cols * rows);
	if (!ctx) return luminance;
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = "high";
	ctx.drawImage(image, 0, 0, cols, rows);
	const { data } = ctx.getImageData(0, 0, cols, rows);

	let min = 1;
	let max = 0;
	for (let i = 0; i < luminance.length; i++) {
		const alpha = data[i * 4 + 3] / 255;
		const value =
			((0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255) * alpha;
		luminance[i] = value;
		if (value < min) min = value;
		if (value > max) max = value;
	}

	const sharpened = new Float32Array(luminance.length);
	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			let sum = 0;
			let samples = 0;
			for (let dy = -1; dy <= 1; dy++) {
				const y = row + dy;
				if (y < 0 || y >= rows) continue;
				for (let dx = -1; dx <= 1; dx++) {
					const x = col + dx;
					if (x < 0 || x >= cols) continue;
					sum += luminance[y * cols + x];
					samples++;
				}
			}
			const i = row * cols + col;
			sharpened[i] = luminance[i] + (luminance[i] - sum / samples) * SHARPEN;
		}
	}

	const sorted = Float32Array.from(sharpened).sort();
	const low = sorted[Math.floor(sorted.length * CLIP)];
	const high = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * (1 - CLIP)))];
	const range = high - low || 1;
	for (let i = 0; i < sharpened.length; i++) {
		sharpened[i] = Math.min(1, Math.max(0, (sharpened[i] - low) / range));
	}
	return sharpened;
}

function measureRamp(): Ramp {
	const size = 48;
	const width = Math.ceil(size * CHAR_ASPECT);
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = size;
	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	const lookup = new Uint8Array(256);
	if (!ctx) return { chars: " ", lookup };
	ctx.font = `${size}px ${FONT_FAMILY}`;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillStyle = "#000";

	const measured = Array.from(new Set(RAMP)).map((char) => {
		ctx.clearRect(0, 0, width, size);
		ctx.fillText(char, width / 2, size / 2);
		const { data } = ctx.getImageData(0, 0, width, size);
		let ink = 0;
		for (let i = 3; i < data.length; i += 4) ink += data[i];
		return { char, ink };
	});
	measured.sort((a, b) => a.ink - b.ink);

	const maxInk = measured[measured.length - 1].ink || 1;
	const levels = measured.map(({ ink }) => ink / maxInk);
	let glyph = 0;
	for (let level = 0; level < 256; level++) {
		const target = level / 255;
		while (
			glyph < levels.length - 1 &&
			Math.abs(levels[glyph + 1] - target) <= Math.abs(levels[glyph] - target)
		) {
			glyph++;
		}
		lookup[level] = glyph;
	}
	return { chars: measured.map(({ char }) => char).join(""), lookup };
}

function buildAtlas(chars: string, fontSize: number, slot: number, color: string, dpr: number) {
	const atlas = document.createElement("canvas");
	atlas.width = Math.ceil(slot * dpr) * chars.length;
	atlas.height = Math.ceil(slot * dpr);
	const ctx = atlas.getContext("2d");
	if (!ctx) return atlas;
	const pixels = Math.ceil(slot * dpr);
	ctx.font = `${fontSize * dpr}px ${FONT_FAMILY}`;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillStyle = color;
	for (let i = 0; i < chars.length; i++) {
		ctx.fillText(chars[i], pixels * i + pixels / 2, pixels / 2);
	}
	return atlas;
}

export function AsciiField({ image, label }: AsciiFieldProps) {
	const wrapperRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const prefersReducedMotion = useReducedMotion() ?? false;

	useEffect(() => {
		const wrapper = wrapperRef.current;
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!wrapper || !canvas || !ctx) return;

		const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const pointer = { x: 0, y: 0, active: false };
		const ramp = measureRamp();
		const ripples: Ripple[] = [];

		let field: Field | null = null;
		let atlas: HTMLCanvasElement | null = null;
		let fontSize = 10;
		let cellWidth = fontSize * CHAR_ASPECT;
		let slot = fontSize + 2;
		let layoutWidth = 0;
		let diagonal = 0;
		let dpr = 1;
		let frameId = 0;
		let first = true;

		const assignGlyphs = () => {
			if (!field) return;
			const dark = darkQuery.matches;
			for (let i = 0; i < field.count; i++) {
				const density = dark ? field.luminance[i] : 1 - field.luminance[i];
				field.glyph[i] = ramp.lookup[Math.round(density * 255)];
			}
		};

		const paint = () => {
			const color = getComputedStyle(wrapper).getPropertyValue("--color-foreground").trim();
			atlas = buildAtlas(ramp.chars, fontSize, slot, color || "#2c2c2c", dpr);
		};

		const draw = () => {
			if (!field || !atlas) return;
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			const pixels = atlas.height;
			const size = pixels / dpr;
			const offset = size / 2;
			for (let i = 0; i < field.count; i++) {
				const glyph = field.glyph[i];
				if (glyph === 0) continue;
				ctx.drawImage(
					atlas,
					glyph * pixels,
					0,
					pixels,
					pixels,
					field.x[i] - offset,
					field.y[i] - offset,
					size,
					size
				);
			}
		};

		const step = () => {
			if (!field) return false;
			const radiusSq = RADIUS * RADIUS;
			let moving = false;

			for (let r = ripples.length - 1; r >= 0; r--) {
				const ripple = ripples[r];
				ripple.radius += RIPPLE_SPEED;
				ripple.strength *= RIPPLE_DECAY;
				if (ripple.radius - RIPPLE_WIDTH > diagonal || ripple.strength < 0.02) {
					ripples.splice(r, 1);
				}
			}

			for (let i = 0; i < field.count; i++) {
				let vx = field.vx[i];
				let vy = field.vy[i];
				const x = field.x[i];
				const y = field.y[i];

				if (pointer.active) {
					const dx = x - pointer.x;
					const dy = y - pointer.y;
					const distSq = dx * dx + dy * dy;
					if (distSq < radiusSq) {
						const dist = Math.sqrt(distSq) || 1;
						const falloff = 1 - dist / RADIUS;
						const force = falloff * falloff * PUSH;
						vx += (dx / dist) * force;
						vy += (dy / dist) * force;
					}
				}

				for (const ripple of ripples) {
					const dx = x - ripple.x;
					const dy = y - ripple.y;
					const dist = Math.sqrt(dx * dx + dy * dy) || 1;
					const offset = dist - ripple.radius;
					if (offset > -RIPPLE_WIDTH && offset < RIPPLE_WIDTH) {
						const force = Math.cos((offset / RIPPLE_WIDTH) * (Math.PI / 2)) * ripple.strength;
						vx += (dx / dist) * force;
						vy += (dy / dist) * force;
					}
				}

				vx = (vx + (field.homeX[i] - x) * SPRING) * DAMPING;
				vy = (vy + (field.homeY[i] - y) * SPRING) * DAMPING;
				field.vx[i] = vx;
				field.vy[i] = vy;
				field.x[i] = x + vx;
				field.y[i] = y + vy;

				if (
					!moving &&
					(Math.abs(vx) > REST ||
						Math.abs(vy) > REST ||
						Math.abs(field.homeX[i] - field.x[i]) > REST ||
						Math.abs(field.homeY[i] - field.y[i]) > REST)
				) {
					moving = true;
				}
			}
			return moving || ripples.length > 0;
		};

		const tick = () => {
			const moving = step();
			draw();
			frameId = moving ? requestAnimationFrame(tick) : 0;
		};

		const wake = () => {
			if (prefersReducedMotion || frameId) return;
			frameId = requestAnimationFrame(tick);
		};

		const layout = () => {
			const available = wrapper.clientWidth;
			if (!available || available === layoutWidth) return;
			layoutWidth = available;
			fontSize = available < 640 ? 5 : 7;
			cellWidth = fontSize * CHAR_ASPECT;
			slot = fontSize + 2;
			dpr = Math.min(window.devicePixelRatio || 1, 2);

			const maxHeight = window.innerHeight * MAX_HEIGHT_RATIO;
			const scale = Math.min(available / image.width, maxHeight / image.height);
			const cols = Math.max(1, Math.floor((image.width * scale) / cellWidth));
			const rows = Math.max(1, Math.floor((image.height * scale) / fontSize));
			const width = cols * cellWidth;
			const height = rows * fontSize;
			diagonal = Math.hypot(width, height);

			canvas.width = Math.round(width * dpr);
			canvas.height = Math.round(height * dpr);
			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;

			const count = cols * rows;
			const scatter = first && !prefersReducedMotion ? SCATTER : 0;
			field = {
				count,
				homeX: new Float32Array(count),
				homeY: new Float32Array(count),
				x: new Float32Array(count),
				y: new Float32Array(count),
				vx: new Float32Array(count),
				vy: new Float32Array(count),
				glyph: new Uint8Array(count),
				luminance: sampleLuminance(image, cols, rows),
			};
			for (let row = 0; row < rows; row++) {
				for (let col = 0; col < cols; col++) {
					const i = row * cols + col;
					const homeX = col * cellWidth + cellWidth / 2;
					const homeY = row * fontSize + fontSize / 2;
					field.homeX[i] = homeX;
					field.homeY[i] = homeY;
					field.x[i] = homeX + (Math.random() - 0.5) * scatter;
					field.y[i] = homeY + (Math.random() - 0.5) * scatter;
				}
			}
			first = false;

			assignGlyphs();
			paint();
			draw();
			wake();
		};

		const toLocal = (event: PointerEvent) => {
			const rect = canvas.getBoundingClientRect();
			pointer.x = event.clientX - rect.left;
			pointer.y = event.clientY - rect.top;
		};

		const onPointerMove = (event: PointerEvent) => {
			toLocal(event);
			pointer.active = true;
			wake();
		};

		const onPointerDown = (event: PointerEvent) => {
			onPointerMove(event);
			ripples.push({ x: pointer.x, y: pointer.y, radius: 0, strength: RIPPLE_FORCE });
		};

		const onPointerLeave = () => {
			pointer.active = false;
		};

		const onPointerUp = (event: PointerEvent) => {
			if (event.pointerType !== "mouse") pointer.active = false;
		};

		const onSchemeChange = () => {
			assignGlyphs();
			paint();
			draw();
		};

		layout();

		const observer = new ResizeObserver(() => layout());
		observer.observe(wrapper);
		darkQuery.addEventListener("change", onSchemeChange);
		if (!prefersReducedMotion) {
			canvas.addEventListener("pointermove", onPointerMove);
			canvas.addEventListener("pointerdown", onPointerDown);
			canvas.addEventListener("pointerleave", onPointerLeave);
			canvas.addEventListener("pointerup", onPointerUp);
			canvas.addEventListener("pointercancel", onPointerLeave);
		}

		return () => {
			cancelAnimationFrame(frameId);
			observer.disconnect();
			darkQuery.removeEventListener("change", onSchemeChange);
			canvas.removeEventListener("pointermove", onPointerMove);
			canvas.removeEventListener("pointerdown", onPointerDown);
			canvas.removeEventListener("pointerleave", onPointerLeave);
			canvas.removeEventListener("pointerup", onPointerUp);
			canvas.removeEventListener("pointercancel", onPointerLeave);
		};
	}, [image, prefersReducedMotion]);

	return (
		<div ref={wrapperRef} className="flex w-full justify-center">
			<canvas ref={canvasRef} role="img" aria-label={label} className="touch-none" />
		</div>
	);
}
