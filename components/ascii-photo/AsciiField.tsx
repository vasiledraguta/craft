"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

const RAMP = " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
const FONT_FAMILY = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';
const CHAR_ASPECT = 0.6;
const MAX_HEIGHT_RATIO = 0.8;
const MIN_FONT = 4;
const MAX_FONT = 10;
const SOURCE_PIXELS_PER_CELL = 2;
const MAX_CELLS = 160000;
const CLIP = 0.01;
const SHARPEN = 0.5;
const SHADES = 8;
const MIN_OPACITY = 0.25;

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

const VERTEX_SHADER = `#version 300 es
in vec2 a_corner;
in vec2 a_position;
in vec2 a_cell;
uniform vec2 u_resolution;
uniform vec2 u_grid;
uniform float u_size;
out vec2 v_uv;
void main() {
	vec2 point = a_position + (a_corner - 0.5) * u_size;
	vec2 clip = point / u_resolution * 2.0 - 1.0;
	gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
	v_uv = (a_cell + a_corner) / u_grid;
}`;

const FRAGMENT_SHADER = `#version 300 es
precision mediump float;
in vec2 v_uv;
uniform sampler2D u_atlas;
out vec4 color;
void main() {
	color = texture(u_atlas, v_uv);
}`;

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
	home: Float32Array;
	position: Float32Array;
	velocity: Float32Array;
	cell: Float32Array;
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

	for (let i = 0; i < luminance.length; i++) {
		const alpha = data[i * 4 + 3] / 255;
		luminance[i] =
			((0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255) * alpha;
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

function buildAtlas(chars: string, fontSize: number, pixels: number, color: string, dpr: number) {
	const atlas = document.createElement("canvas");
	atlas.width = pixels * chars.length;
	atlas.height = pixels * SHADES;
	const ctx = atlas.getContext("2d");
	if (!ctx) return atlas;
	ctx.font = `${fontSize * dpr}px ${FONT_FAMILY}`;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillStyle = color;
	for (let shade = 0; shade < SHADES; shade++) {
		ctx.globalAlpha = MIN_OPACITY + ((1 - MIN_OPACITY) * shade) / (SHADES - 1);
		for (let i = 0; i < chars.length; i++) {
			ctx.fillText(chars[i], pixels * i + pixels / 2, pixels * shade + pixels / 2);
		}
	}
	return atlas;
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
	const shader = gl.createShader(type);
	if (!shader) return null;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

function createRenderer(canvas: HTMLCanvasElement) {
	const gl = canvas.getContext("webgl2", { antialias: false, premultipliedAlpha: true });
	if (!gl) return null;
	const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
	const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
	if (!vertex || !fragment) return null;
	const program = gl.createProgram();
	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
	gl.useProgram(program);
	gl.bindVertexArray(gl.createVertexArray());

	const attribute = (name: string, data: Float32Array, divisor: number, usage: number) => {
		const buffer = gl.createBuffer();
		const location = gl.getAttribLocation(program, name);
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, data, usage);
		gl.enableVertexAttribArray(location);
		gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
		gl.vertexAttribDivisor(location, divisor);
		return buffer;
	};

	attribute("a_corner", new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), 0, gl.STATIC_DRAW);
	const positionBuffer = attribute("a_position", new Float32Array(0), 1, gl.DYNAMIC_DRAW);
	const cellBuffer = attribute("a_cell", new Float32Array(0), 1, gl.STATIC_DRAW);

	gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

	gl.enable(gl.BLEND);
	gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	gl.clearColor(0, 0, 0, 0);

	const resolution = gl.getUniformLocation(program, "u_resolution");
	const grid = gl.getUniformLocation(program, "u_grid");
	const size = gl.getUniformLocation(program, "u_size");

	return {
		resize(width: number, height: number, dpr: number) {
			canvas.width = Math.round(width * dpr);
			canvas.height = Math.round(height * dpr);
			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.uniform2f(resolution, width, height);
		},
		setAtlas(atlas: HTMLCanvasElement, cols: number, rows: number, cellSize: number) {
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
			gl.uniform2f(grid, cols, rows);
			gl.uniform1f(size, cellSize);
		},
		setCells(cells: Float32Array) {
			gl.bindBuffer(gl.ARRAY_BUFFER, cellBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, cells, gl.STATIC_DRAW);
		},
		draw(positions: Float32Array, count: number) {
			gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
		},
	};
}

export function AsciiField({ image, label }: AsciiFieldProps) {
	const wrapperRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const prefersReducedMotion = useReducedMotion() ?? false;

	useEffect(() => {
		const wrapper = wrapperRef.current;
		const canvas = canvasRef.current;
		if (!wrapper || !canvas) return;
		const renderer = createRenderer(canvas);
		if (!renderer) return;

		const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const pointer = { x: 0, y: 0, active: false };
		const ramp = measureRamp();
		const ripples: Ripple[] = [];

		let field: Field | null = null;
		let fontSize = MAX_FONT;
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
				field.cell[i * 2] = ramp.lookup[Math.round(density * 255)];
				field.cell[i * 2 + 1] = Math.round(density * (SHADES - 1));
			}
			renderer.setCells(field.cell);
		};

		const paint = () => {
			const color = getComputedStyle(wrapper).getPropertyValue("--color-foreground").trim();
			const pixels = Math.ceil((fontSize + 2) * dpr);
			const atlas = buildAtlas(ramp.chars, fontSize, pixels, color || "#2c2c2c", dpr);
			renderer.setAtlas(atlas, ramp.chars.length, SHADES, pixels / dpr);
		};

		const draw = () => {
			if (field) renderer.draw(field.position, field.count);
		};

		const step = () => {
			if (!field) return false;
			const { home, position, velocity } = field;
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

			for (let i = 0; i < field.count * 2; i += 2) {
				let vx = velocity[i];
				let vy = velocity[i + 1];
				const x = position[i];
				const y = position[i + 1];

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

				vx = (vx + (home[i] - x) * SPRING) * DAMPING;
				vy = (vy + (home[i + 1] - y) * SPRING) * DAMPING;
				velocity[i] = vx;
				velocity[i + 1] = vy;
				position[i] = x + vx;
				position[i + 1] = y + vy;

				if (
					!moving &&
					(Math.abs(vx) > REST ||
						Math.abs(vy) > REST ||
						Math.abs(home[i] - position[i]) > REST ||
						Math.abs(home[i + 1] - position[i + 1]) > REST)
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
			dpr = Math.min(window.devicePixelRatio || 1, 2);

			const maxHeight = window.innerHeight * MAX_HEIGHT_RATIO;
			const scale = Math.min(available / image.width, maxHeight / image.height);
			const displayWidth = image.width * scale;
			const displayHeight = image.height * scale;
			const detailFont = displayWidth / ((image.width / SOURCE_PIXELS_PER_CELL) * CHAR_ASPECT);
			const budgetFont = Math.sqrt((displayWidth * displayHeight) / (MAX_CELLS * CHAR_ASPECT));
			fontSize = Math.min(MAX_FONT, Math.max(MIN_FONT, budgetFont, detailFont));
			const cellWidth = fontSize * CHAR_ASPECT;

			const cols = Math.max(1, Math.floor(displayWidth / cellWidth));
			const rows = Math.max(1, Math.floor(displayHeight / fontSize));
			const width = cols * cellWidth;
			const height = rows * fontSize;
			diagonal = Math.hypot(width, height);

			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;
			renderer.resize(width, height, dpr);

			const count = cols * rows;
			const scatter = first && !prefersReducedMotion ? SCATTER : 0;
			field = {
				count,
				home: new Float32Array(count * 2),
				position: new Float32Array(count * 2),
				velocity: new Float32Array(count * 2),
				cell: new Float32Array(count * 2),
				luminance: sampleLuminance(image, cols, rows),
			};
			for (let row = 0; row < rows; row++) {
				for (let col = 0; col < cols; col++) {
					const i = (row * cols + col) * 2;
					const homeX = col * cellWidth + cellWidth / 2;
					const homeY = row * fontSize + fontSize / 2;
					field.home[i] = homeX;
					field.home[i + 1] = homeY;
					field.position[i] = homeX + (Math.random() - 0.5) * scatter;
					field.position[i + 1] = homeY + (Math.random() - 0.5) * scatter;
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
