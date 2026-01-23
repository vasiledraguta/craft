export type PatternResult = {
	opacity: number;
	scale: number;
	color?: string;
};

export type PatternFn = (row: number, col: number, size: number, time: number) => PatternResult;

// Helper: distance from center of grid
const distanceFromCenter = (row: number, col: number, size: number): number => {
	const center = (size - 1) / 2;
	return Math.sqrt((row - center) ** 2 + (col - center) ** 2);
};

// Helper: max distance from center (corner distance)
const maxDistance = (size: number): number => {
	const center = (size - 1) / 2;
	return Math.sqrt(2 * center ** 2);
};

// Helper: snake path index
const snakeIndex = (row: number, col: number, size: number): number => {
	if (row % 2 === 0) {
		return row * size + col;
	}
	return row * size + (size - 1 - col);
};

// Helper: pseudo-random based on seed
const pseudoRandom = (seed: number): number => {
	const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
	return x - Math.floor(x);
};

// 1. Pulse - All dots pulse in unison
export const pulse: PatternFn = (_row, _col, _size, time) => {
	const intensity = (Math.sin(time * 3) + 1) / 2;
	return {
		opacity: 0.3 + intensity * 0.7,
		scale: 0.6 + intensity * 0.4,
	};
};

// 2. Wave - Horizontal wave sweeping across
export const wave: PatternFn = (row, col, size, time) => {
	const normalizedPos = (row + col) / (size * 2);
	const phase = normalizedPos * Math.PI * 2;
	const intensity = (Math.sin(time * 2.5 + phase * 3) + 1) / 2;
	return {
		opacity: 0.2 + intensity * 0.8,
		scale: 0.5 + intensity * 0.5,
	};
};

// 3. Wave Diagonal - Diagonal wave variant
export const waveDiagonal: PatternFn = (row, col, size, time) => {
	const normalizedPos = (row - col + size) / (size * 2);
	const phase = normalizedPos * Math.PI * 2;
	const intensity = (Math.sin(time * 2 + phase * 4) + 1) / 2;
	return {
		opacity: 0.15 + intensity * 0.85,
		scale: 0.4 + intensity * 0.6,
	};
};

// 4. Ripple - Circular ripple from center
export const ripple: PatternFn = (row, col, size, time) => {
	const dist = distanceFromCenter(row, col, size);
	const maxDist = maxDistance(size);
	const normalizedDist = dist / maxDist;
	const intensity = (Math.sin(time * 3 - normalizedDist * Math.PI * 4) + 1) / 2;
	return {
		opacity: 0.2 + intensity * 0.8,
		scale: 0.5 + intensity * 0.5,
	};
};

// Snake - Sequential highlight following snake path
export const snake: PatternFn = (row, col, size, time) => {
	const index = snakeIndex(row, col, size);
	const totalCells = size * size;
	const progress = ((time * 0.8) % 1) * totalCells;
	const distance = Math.abs(index - progress);
	const tailLength = totalCells * 0.3;
	const intensity = Math.max(0, 1 - distance / tailLength);
	return {
		opacity: 0.15 + intensity * 0.85,
		scale: 0.5 + intensity * 0.5,
	};
};

// Cascade - Top-to-bottom cascade effect
export const cascade: PatternFn = (row, col, size, time) => {
	const normalizedRow = row / (size - 1);
	const normalizedCol = col / (size - 1);
	const delay = normalizedRow * 0.5 + normalizedCol * 0.25;
	const intensity = (Math.sin(time * 2.5 - delay * Math.PI * 2) + 1) / 2;
	return {
		opacity: 0.2 + intensity * 0.8,
		scale: 0.45 + intensity * 0.55,
	};
};

// 10. Checkerboard - Alternating pattern
export const checkerboard: PatternFn = (row, col, _size, time) => {
	const isEven = (row + col) % 2 === 0;
	const phase = isEven ? 0 : Math.PI;
	const intensity = (Math.sin(time * 2.5 + phase) + 1) / 2;
	return {
		opacity: 0.15 + intensity * 0.85,
		scale: 0.4 + intensity * 0.6,
	};
};

// 11. Rain - Falling dots effect
export const rain: PatternFn = (row, col, size, time) => {
	const seed = pseudoRandom(col * 100);
	const speed = 1.5 + seed * 1.5;
	const offset = seed * size;
	const position = ((time * speed + offset) % (size + 2)) - 1;
	const distance = Math.abs(row - position);
	const intensity = Math.max(0, 1 - distance / 1.5);
	return {
		opacity: 0.1 + intensity * 0.9,
		scale: 0.4 + intensity * 0.6,
	};
};

// 12. Heartbeat - Sharp pulse from center
export const heartbeat: PatternFn = (row, col, size, time) => {
	const dist = distanceFromCenter(row, col, size);
	const maxDist = maxDistance(size);
	const normalizedDist = dist / maxDist;
	// Create sharp heartbeat pattern
	const beat = Math.abs(Math.sin(time * 4));
	const sharpBeat = Math.pow(beat, 8);
	const delay = normalizedDist * 0.15;
	const delayedTime = time - delay;
	const intensity = Math.pow(Math.abs(Math.sin(delayedTime * 4)), 8);
	return {
		opacity: 0.2 + intensity * 0.8,
		scale: 0.5 + sharpBeat * 0.3 + intensity * 0.2,
	};
};

// 13. Orbit - Rotating highlight around center
export const orbit: PatternFn = (row, col, size, time) => {
	const center = (size - 1) / 2;
	const angle = Math.atan2(row - center, col - center);
	const dist = distanceFromCenter(row, col, size);
	const maxDist = maxDistance(size);
	const normalizedDist = dist / maxDist;

	// Rotating angle
	const rotatingAngle = time * 2;
	const angleDiff = Math.abs(Math.sin((angle - rotatingAngle) / 2));

	// Only highlight dots at certain radius
	const radiusMatch = 1 - Math.abs(normalizedDist - 0.6) * 3;
	const intensity = Math.max(0, (1 - angleDiff) * radiusMatch);

	return {
		opacity: 0.15 + intensity * 0.85,
		scale: 0.45 + intensity * 0.55,
	};
};

// Cross - Cross pattern expanding from center
export const cross: PatternFn = (row, col, size, time) => {
	const center = (size - 1) / 2;
	const isOnCross = Math.abs(row - center) < 0.5 || Math.abs(col - center) < 0.5;
	const dist = isOnCross
		? Math.min(Math.abs(row - center), Math.abs(col - center)) +
			Math.max(Math.abs(row - center), Math.abs(col - center))
		: distanceFromCenter(row, col, size);
	const maxDist = size - 1;
	const normalizedDist = dist / maxDist;

	const wavePos = (time * 1.5) % 1;
	const distance = Math.abs(normalizedDist - wavePos);
	const intensity = isOnCross ? Math.max(0, 1 - distance * 4) : Math.max(0, 0.3 - distance);

	return {
		opacity: 0.1 + intensity * 0.9,
		scale: 0.4 + intensity * 0.6,
	};
};

// 16. Corners - Animate from corners
export const corners: PatternFn = (row, col, size, time) => {
	const cornerDists = [
		Math.sqrt(row ** 2 + col ** 2), // top-left
		Math.sqrt(row ** 2 + (size - 1 - col) ** 2), // top-right
		Math.sqrt((size - 1 - row) ** 2 + col ** 2), // bottom-left
		Math.sqrt((size - 1 - row) ** 2 + (size - 1 - col) ** 2), // bottom-right
	];

	const maxDist = Math.sqrt(2) * (size - 1);
	const cornerIndex = Math.floor((time * 0.5) % 4);
	const progress = (time * 0.5) % 1;

	const normalizedDist = cornerDists[cornerIndex] / maxDist;
	const distance = Math.abs(normalizedDist - progress);
	const intensity = Math.max(0, 1 - distance * 4);

	return {
		opacity: 0.15 + intensity * 0.85,
		scale: 0.45 + intensity * 0.55,
	};
};

// 17. Scan - Horizontal scanning line
export const scan: PatternFn = (row, _col, size, time) => {
	const normalizedRow = row / (size - 1);
	const scanPos = (time * 0.8) % 1;
	const distance = Math.abs(normalizedRow - scanPos);
	const intensity = Math.max(0, 1 - distance * 5);
	return {
		opacity: 0.1 + intensity * 0.9,
		scale: 0.4 + intensity * 0.6,
	};
};

// 18. DNA - Double helix pattern
export const dna: PatternFn = (row, col, size, time) => {
	const center = (size - 1) / 2;
	const normalizedRow = row / (size - 1);

	// Two sine waves offset by half period
	const wave1 = Math.sin(normalizedRow * Math.PI * 2 + time * 2) * (size / 4);
	const wave2 = Math.sin(normalizedRow * Math.PI * 2 + time * 2 + Math.PI) * (size / 4);

	const dist1 = Math.abs(col - center - wave1);
	const dist2 = Math.abs(col - center - wave2);
	const minDist = Math.min(dist1, dist2);

	const intensity = Math.max(0, 1 - minDist / 1.5);
	return {
		opacity: 0.1 + intensity * 0.9,
		scale: 0.4 + intensity * 0.6,
	};
};

// 19. Stagger - Staggered row animation
export const stagger: PatternFn = (row, col, size, time) => {
	const delay = row * 0.15 + col * 0.05;
	const intensity = (Math.sin(time * 3 - delay * Math.PI) + 1) / 2;
	return {
		opacity: 0.2 + intensity * 0.8,
		scale: 0.5 + intensity * 0.5,
	};
};

// 20. Pinwheel - Rotating pinwheel pattern
export const pinwheel: PatternFn = (row, col, size, time) => {
	const center = (size - 1) / 2;
	const angle = Math.atan2(row - center, col - center);
	const dist = distanceFromCenter(row, col, size);

	// Create 4 blades
	const bladeAngle = (angle + time * 1.5) * 2;
	const blade = (Math.sin(bladeAngle) + 1) / 2;

	// Fade out towards edges
	const maxDist = maxDistance(size);
	const edgeFade = 1 - (dist / maxDist) * 0.3;

	const intensity = blade * edgeFade;
	return {
		opacity: 0.15 + intensity * 0.85,
		scale: 0.45 + intensity * 0.55,
	};
};

// Radar - Rotating radar sweep
export const radar: PatternFn = (row, col, size, time) => {
	const center = (size - 1) / 2;
	const angle = Math.atan2(row - center, col - center);
	const normalizedAngle = (angle + Math.PI) / (2 * Math.PI);
	const sweepAngle = (time * 0.5) % 1;
	const diff = Math.abs(normalizedAngle - sweepAngle);
	const wrappedDiff = Math.min(diff, 1 - diff);
	const intensity = Math.max(0, 1 - wrappedDiff * 8);
	return {
		opacity: 0.1 + intensity * 0.9,
		scale: 0.4 + intensity * 0.6,
	};
};

// 23. Diamond - Diamond shape expanding from center
export const diamond: PatternFn = (row, col, size, time) => {
	const center = (size - 1) / 2;
	const manhattanDist = Math.abs(row - center) + Math.abs(col - center);
	const maxManhattan = size - 1;
	const normalizedDist = manhattanDist / maxManhattan;
	const wavePos = (time * 1.2) % 1;
	const distance = Math.abs(normalizedDist - wavePos);
	const intensity = Math.max(0, 1 - distance * 5);
	return {
		opacity: 0.15 + intensity * 0.85,
		scale: 0.45 + intensity * 0.55,
	};
};

// Fibonacci Spiral - Dots light up in spiral order with trailing glow
export const fibonacci: PatternFn = (row, col, size, time) => {
	// Spiral order for 3x3: center → right → up → left-left → down-down → right-right-right
	const spiralOrder = [
		[1, 1],
		[1, 2],
		[0, 2],
		[0, 1],
		[0, 0],
		[1, 0],
		[2, 0],
		[2, 1],
		[2, 2],
	];
	const index = spiralOrder.findIndex(([r, c]) => r === row && c === col);
	const totalCells = size * size;
	const progress = ((time * 0.6) % 1) * (totalCells + 3);
	const distance = index - progress;
	const tailLength = 3;
	const intensity =
		distance >= -tailLength && distance <= 0 ? 1 - Math.abs(distance) / tailLength : 0;
	return {
		opacity: 0.1 + intensity * 0.9,
		scale: 0.4 + intensity * 0.6,
	};
};

// Wave Interference - Multiple wave sources creating interference patterns
export const waveInterference: PatternFn = (row, col, size, time) => {
	// Wave sources at corners
	const sources = [
		[0, 0],
		[0, size - 1],
		[size - 1, 0],
		[size - 1, size - 1],
	];
	let totalWave = 0;
	sources.forEach(([sr, sc], i) => {
		const dist = Math.sqrt((row - sr) ** 2 + (col - sc) ** 2);
		const phase = (i * Math.PI) / 2;
		totalWave += Math.sin(time * 3 - dist * 2 + phase);
	});
	const intensity = (totalWave / sources.length + 1) / 2;
	return {
		opacity: 0.1 + intensity * 0.9,
		scale: 0.4 + intensity * 0.6,
	};
};

// Gravity Wells - Two orbiting masses affect dot brightness
export const gravityWells: PatternFn = (row, col, size, time) => {
	const c = (size - 1) / 2;
	const orbitRadius = size * 0.4;
	// Two masses orbiting opposite each other
	const mass1 = {
		r: c + Math.cos(time * 1.5) * orbitRadius,
		c: c + Math.sin(time * 1.5) * orbitRadius,
	};
	const mass2 = {
		r: c + Math.cos(time * 1.5 + Math.PI) * orbitRadius,
		c: c + Math.sin(time * 1.5 + Math.PI) * orbitRadius,
	};
	const dist1 = Math.sqrt((row - mass1.r) ** 2 + (col - mass1.c) ** 2);
	const dist2 = Math.sqrt((row - mass2.r) ** 2 + (col - mass2.c) ** 2);
	const gravity = 1 / (dist1 + 0.5) + 1 / (dist2 + 0.5);
	const intensity = Math.min(1, gravity / 2);
	return {
		opacity: 0.15 + intensity * 0.85,
		scale: 0.45 + intensity * 0.55,
	};
};

// Kaleidoscope - 4-way symmetrical mirrored animation
export const kaleidoscope: PatternFn = (row, col, size, time) => {
	const center = (size - 1) / 2;
	// Mirror coordinates to create 4-way symmetry
	const mr = row <= center ? row : size - 1 - row;
	const mc = col <= center ? col : size - 1 - col;
	// Generate pattern based on mirrored position
	const seed = mr * 10 + mc;
	const phase = pseudoRandom(seed) * Math.PI * 2;
	const freq = 2 + pseudoRandom(seed * 2);
	const intensity = (Math.sin(time * freq + phase) + 1) / 2;
	return {
		opacity: 0.15 + intensity * 0.85,
		scale: 0.45 + intensity * 0.55,
	};
};

// Perlin Noise Flow - Smooth organic flowing brightness
export const perlinFlow: PatternFn = (row, col, size, time) => {
	const scale = 0.8;
	const x = col * scale + time * 0.5;
	const y = row * scale + time * 0.3;
	// Simplified smooth noise using layered sine waves
	const noise =
		Math.sin(x * 1.2 + y * 0.8) * 0.5 +
		Math.sin(x * 0.7 - y * 1.3 + time) * 0.3 +
		Math.sin((x + y) * 0.9 + time * 0.7) * 0.2;
	const intensity = (noise + 1) / 2;
	return {
		opacity: 0.2 + intensity * 0.8,
		scale: 0.5 + intensity * 0.5,
	};
};

// Quantum - Probabilistic flickering based on distance from center
export const quantum: PatternFn = (row, col, size, time) => {
	const dist = distanceFromCenter(row, col, size);
	const maxDist = maxDistance(size);
	const probability = 1 - (dist / maxDist) * 0.7;
	// Use time-based pseudo-random for probabilistic effect
	const seed = row * size + col + Math.floor(time * 8);
	const random = pseudoRandom(seed);
	const isActive = random < probability;
	// Add smooth transition
	const flicker = isActive ? 0.7 + random * 0.3 : 0.1 + random * 0.2;
	return {
		opacity: flicker,
		scale: 0.4 + flicker * 0.5,
	};
};

// Pattern registry
export const patterns: Record<string, PatternFn> = {
	pulse,
	wave,
	waveDiagonal,
	ripple,
	snake,
	cascade,
	checkerboard,
	rain,
	heartbeat,
	orbit,
	cross,
	corners,
	scan,
	dna,
	stagger,
	pinwheel,
	radar,
	diamond,
	fibonacci,
	waveInterference,
	gravityWells,
	kaleidoscope,
	perlinFlow,
	quantum,
};

export type PatternName = keyof typeof patterns;
