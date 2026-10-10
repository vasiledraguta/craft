export type ZipperSound = ReturnType<typeof createZipperSound>;

export function createZipperSound() {
	let context: AudioContext | null = null;
	let noise: AudioBuffer | null = null;
	let lastTick = 0;

	const unlock = () => {
		if (!context) {
			context = new AudioContext();
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
		delay = 0
	) => {
		if (!context || !noise) return;
		const start = context.currentTime + delay;
		const source = context.createBufferSource();
		source.buffer = noise;
		const filter = context.createBiquadFilter();
		filter.type = type;
		filter.frequency.value = frequency;
		filter.Q.value = q;
		const gain = context.createGain();
		gain.gain.setValueAtTime(0.0001, start);
		gain.gain.exponentialRampToValueAtTime(volume, start + 0.002);
		gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
		source.connect(filter).connect(gain).connect(context.destination);
		source.start(start, Math.random() * 0.1, duration + 0.01);
	};

	const tone = (frequency: number, volume: number, duration: number, delay = 0) => {
		if (!context) return;
		const start = context.currentTime + delay;
		const oscillator = context.createOscillator();
		oscillator.type = "sine";
		oscillator.frequency.setValueAtTime(frequency, start);
		oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.45, start + duration * 0.8);
		const gain = context.createGain();
		gain.gain.setValueAtTime(0.0001, start);
		gain.gain.exponentialRampToValueAtTime(volume, start + 0.004);
		gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
		oscillator.connect(gain).connect(context.destination);
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
		burst("bandpass", frequency, 9, 0.9 * intensity, 0.03);
		burst("bandpass", frequency * 0.5, 2, 0.25 * intensity, 0.018);
	};

	const snap = () => {
		tone(140, 0.4, 0.22);
		burst("highpass", 2200, 0.7, 0.35, 0.09);
		burst("lowpass", 900, 1, 0.45, 0.06);
	};

	const heartbeat = () => {
		tone(95, 0.45, 0.18);
		burst("lowpass", 500, 1, 0.3, 0.05);
		tone(78, 0.32, 0.2, 0.17);
		burst("lowpass", 420, 1, 0.22, 0.05, 0.17);
	};

	const dispose = () => {
		context?.close();
		context = null;
		noise = null;
	};

	return { unlock, tick, snap, heartbeat, dispose };
}
