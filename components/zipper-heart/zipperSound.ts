export type ZipperSound = ReturnType<typeof createZipperSound>;

export function createZipperSound() {
	let context: AudioContext | null = null;
	let output: GainNode | null = null;
	let noise: AudioBuffer | null = null;
	let lastTick = 0;

	const unlock = () => {
		if (!context) {
			context = new AudioContext();
			output = context.createGain();
			output.gain.value = 0.8;
			output.connect(context.destination);
			noise = context.createBuffer(1, Math.floor(context.sampleRate * 0.2), context.sampleRate);
			const data = noise.getChannelData(0);
			for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
		}
		if (context.state === "suspended") context.resume();
	};

	const burst = (
		type: BiquadFilterType,
		frequency: number,
		q: number,
		volume: number,
		duration: number,
		{ delay = 0, attack = 0.002 } = {}
	) => {
		if (!context || !output || !noise) return;
		const start = context.currentTime + delay;
		const source = context.createBufferSource();
		source.buffer = noise;
		const filter = context.createBiquadFilter();
		filter.type = type;
		filter.frequency.value = frequency;
		filter.Q.value = q;
		const gain = context.createGain();
		gain.gain.setValueAtTime(0.0001, start);
		gain.gain.exponentialRampToValueAtTime(volume, start + attack);
		gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
		source.connect(filter).connect(gain).connect(output);
		source.start(start, Math.random() * 0.1, duration + 0.01);
	};

	const tone = (
		frequency: number,
		volume: number,
		duration: number,
		{ delay = 0, attack = 0.004, drop = 0.45 } = {}
	) => {
		if (!context || !output) return;
		const start = context.currentTime + delay;
		const oscillator = context.createOscillator();
		oscillator.type = "sine";
		oscillator.frequency.setValueAtTime(frequency, start);
		oscillator.frequency.exponentialRampToValueAtTime(frequency * drop, start + duration * 0.8);
		const gain = context.createGain();
		gain.gain.setValueAtTime(0.0001, start);
		gain.gain.exponentialRampToValueAtTime(volume, start + attack);
		gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
		oscillator.connect(gain).connect(output);
		oscillator.start(start);
		oscillator.stop(start + duration + 0.02);
	};

	const tick = (closing: boolean, speed: number) => {
		if (!context) return;
		const now = context.currentTime;
		if (now - lastTick < 0.014) return;
		lastTick = now;
		const intensity = Math.min(1, 0.4 + speed * 0.2);
		const frequency =
			(closing ? 3600 : 2700) * (0.92 + Math.random() * 0.16) * (1 + intensity * 0.1);
		burst("bandpass", frequency, 9, 0.5 * intensity, 0.03);
		burst("bandpass", frequency * 0.5, 2, 0.14 * intensity, 0.018);
	};

	const snap = () => {
		tone(118, 0.22, 0.32, { attack: 0.012, drop: 0.55 });
		burst("lowpass", 650, 0.7, 0.12, 0.16, { attack: 0.01 });
		tone(1760, 0.035, 0.35, { delay: 0.01, attack: 0.003, drop: 0.98 });
	};

	const heartbeat = () => {
		tone(2200, 0.025, 0.25, { attack: 0.003, drop: 0.98 });
		tone(88, 0.22, 0.24, { delay: 0.03, attack: 0.015, drop: 0.6 });
		burst("lowpass", 320, 0.7, 0.08, 0.08, { delay: 0.03, attack: 0.01 });
		tone(72, 0.15, 0.26, { delay: 0.25, attack: 0.015, drop: 0.6 });
		burst("lowpass", 280, 0.7, 0.05, 0.08, { delay: 0.25, attack: 0.01 });
	};

	const dispose = () => {
		context?.close();
		context = null;
		output = null;
		noise = null;
	};

	return { unlock, tick, snap, heartbeat, dispose };
}
