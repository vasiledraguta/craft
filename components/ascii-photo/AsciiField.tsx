"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

const CHARSET = " .:-=+*#%@";
const FONT_FAMILY = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';
const CHAR_ASPECT = 0.6;
const MAX_HEIGHT_RATIO = 0.7;

const RADIUS = 90;
const PUSH = 3.2;
const SPRING = 0.045;
const DAMPING = 0.86;
const SCATTER = 48;
const REST = 0.01;

interface AsciiFieldProps {
	image: ImageBitmap;
	label: string;
}

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

	const range = max - min || 1;
	for (let i = 0; i < luminance.length; i++) {
		luminance[i] = (luminance[i] - min) / range;
	}
	return luminance;
}

function buildAtlas(fontSize: number, cellWidth: number, color: string, dpr: number) {
	const atlas = document.createElement("canvas");
	atlas.width = Math.ceil(cellWidth * CHARSET.length * dpr);
	atlas.height = Math.ceil(fontSize * dpr);
	const ctx = atlas.getContext("2d");
	if (!ctx) return atlas;
	ctx.scale(dpr, dpr);
	ctx.font = `${fontSize}px ${FONT_FAMILY}`;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillStyle = color;
	for (let i = 0; i < CHARSET.length; i++) {
		ctx.fillText(CHARSET[i], cellWidth * i + cellWidth / 2, fontSize / 2);
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

		let field: Field | null = null;
		let atlas: HTMLCanvasElement | null = null;
		let fontSize = 10;
		let cellWidth = fontSize * CHAR_ASPECT;
		let layoutWidth = 0;
		let dpr = 1;
		let frameId = 0;
		let first = true;

		const assignGlyphs = () => {
			if (!field) return;
			const dark = darkQuery.matches;
			const last = CHARSET.length - 1;
			for (let i = 0; i < field.count; i++) {
				const density = dark ? field.luminance[i] : 1 - field.luminance[i];
				field.glyph[i] = Math.round(density * last);
			}
		};

		const paint = () => {
			const color = getComputedStyle(wrapper).getPropertyValue("--color-foreground").trim();
			atlas = buildAtlas(fontSize, cellWidth, color || "#2c2c2c", dpr);
		};

		const draw = () => {
			if (!field || !atlas) return;
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			const sourceWidth = cellWidth * dpr;
			const sourceHeight = fontSize * dpr;
			for (let i = 0; i < field.count; i++) {
				const glyph = field.glyph[i];
				if (glyph === 0) continue;
				ctx.drawImage(
					atlas,
					glyph * sourceWidth,
					0,
					sourceWidth,
					sourceHeight,
					field.x[i] - cellWidth / 2,
					field.y[i] - fontSize / 2,
					cellWidth,
					fontSize
				);
			}
		};

		const step = () => {
			if (!field) return false;
			const radiusSq = RADIUS * RADIUS;
			let moving = false;
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
			return moving;
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
			fontSize = available < 640 ? 7 : 10;
			cellWidth = fontSize * CHAR_ASPECT;
			dpr = Math.min(window.devicePixelRatio || 1, 2);

			const maxHeight = window.innerHeight * MAX_HEIGHT_RATIO;
			const scale = Math.min(available / image.width, maxHeight / image.height);
			const cols = Math.max(1, Math.floor((image.width * scale) / cellWidth));
			const rows = Math.max(1, Math.floor((image.height * scale) / fontSize));
			const width = cols * cellWidth;
			const height = rows * fontSize;

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
			canvas.addEventListener("pointerdown", onPointerMove);
			canvas.addEventListener("pointerleave", onPointerLeave);
			canvas.addEventListener("pointerup", onPointerUp);
			canvas.addEventListener("pointercancel", onPointerLeave);
		}

		return () => {
			cancelAnimationFrame(frameId);
			observer.disconnect();
			darkQuery.removeEventListener("change", onSchemeChange);
			canvas.removeEventListener("pointermove", onPointerMove);
			canvas.removeEventListener("pointerdown", onPointerMove);
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
