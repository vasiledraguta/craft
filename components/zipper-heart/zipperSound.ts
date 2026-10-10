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
		duration: number
	) => {
		if (!context || !noise) return;
		const now = context.currentTime;
		const source = context.createBufferSource();
		source.buffer = noise;
		const filter = context.createBiquadFilter();
		filter.type = type;
		filter.frequency.value = frequency;
		filter.Q.value = q;
		const gain = context.createGain();
		gain.gain.setValueAtTime(0.0001, now);
		gain.gain.exponentialRampToValueAtTime(volume, now + 0.002);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
		source.connect(filter).connect(gain).connect(context.destination);
		source.start(now, Math.random() * 0.1, duration + 0.01);
	};

	const tick = (closing: boolean) => {
		if (!context) return;
		const now = context.currentTime;
		if (now - lastTick < 0.014) return;
		lastTick = now;
		const frequency = (closing ? 3400 : 2500) * (0.9 + Math.random() * 0.2);
		burst("bandpass", frequency, 5, 0.7, 0.035);
	};

	const thump = (frequency: number) => {
		if (!context) return;
		const now = context.currentTime;
		const oscillator = context.createOscillator();
		oscillator.type = "sine";
		oscillator.frequency.setValueAtTime(frequency, now);
		oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.4, now + 0.16);
		const gain = context.createGain();
		gain.gain.setValueAtTime(0.0001, now);
		gain.gain.exponentialRampToValueAtTime(0.35, now + 0.004);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
		oscillator.connect(gain).connect(context.destination);
		oscillator.start(now);
		oscillator.stop(now + 0.22);
		burst("lowpass", 1400, 1, 0.4, 0.05);
	};

	const dispose = () => {
		context?.close();
		context = null;
		noise = null;
	};

	return { unlock, tick, thump, dispose };
}
