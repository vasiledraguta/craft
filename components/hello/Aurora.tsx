"use client";

import { useEffect, useRef } from "react";

interface AuroraProps {
	className?: string;
}

export const Aurora = ({ className = "" }: AuroraProps) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		let animationId: number;
		let time = 0;

		const resize = () => {
			const dpr = window.devicePixelRatio || 1;
			const rect = canvas.getBoundingClientRect();
			canvas.width = rect.width * dpr;
			canvas.height = rect.height * dpr;
			ctx.scale(dpr, dpr);
		};

		resize();
		window.addEventListener("resize", resize);

		const waves = [
			{
				color: { r: 60, g: 60, b: 60 },
				amplitude: 100,
				frequency: 0.003,
				phase: 0,
				speed: 0.004,
				yOffset: 0.3,
			},
			{
				color: { r: 80, g: 80, b: 80 },
				amplitude: 90,
				frequency: 0.002,
				phase: Math.PI * 0.5,
				speed: 0.006,
				yOffset: 0.5,
			},
			{
				color: { r: 40, g: 40, b: 40 },
				amplitude: 120,
				frequency: 0.0025,
				phase: Math.PI,
				speed: 0.005,
				yOffset: 0.7,
			},
		];

		const drawWaves = (animated: boolean) => {
			const { width, height } = canvas.getBoundingClientRect();
			ctx.clearRect(0, 0, width, height);

			waves.forEach((wave) => {
				ctx.beginPath();
				const baseY = height * wave.yOffset;

				for (let x = 0; x <= width; x += 4) {
					const y = animated
						? baseY +
							Math.sin(x * wave.frequency + time * wave.speed + wave.phase) *
								wave.amplitude +
							Math.sin(
								x * wave.frequency * 0.6 +
									time * wave.speed * 0.8 +
									wave.phase * 0.5,
							) *
								(wave.amplitude * 0.4)
						: baseY +
							Math.sin(x * wave.frequency + wave.phase) * wave.amplitude;

					if (x === 0) {
						ctx.moveTo(x, y);
					} else {
						ctx.lineTo(x, y);
					}
				}

				ctx.lineTo(width, height);
				ctx.lineTo(0, height);
				ctx.closePath();

				const gradient = ctx.createLinearGradient(
					0,
					baseY - wave.amplitude,
					0,
					height,
				);
				const alpha = animated
					? 0.12 + Math.sin(time * 0.008 + wave.phase) * 0.04
					: 0.12;
				gradient.addColorStop(
					0,
					`rgba(${wave.color.r}, ${wave.color.g}, ${wave.color.b}, ${alpha})`,
				);
				gradient.addColorStop(
					animated ? 0.6 : 1,
					`rgba(${wave.color.r}, ${wave.color.g}, ${wave.color.b}, ${animated ? alpha * 0.5 : 0})`,
				);
				if (animated)
					gradient.addColorStop(
						1,
						`rgba(${wave.color.r}, ${wave.color.g}, ${wave.color.b}, 0)`,
					);

				ctx.fillStyle = gradient;
				ctx.fill();
			});
		};

		const prefersReducedMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;

		if (prefersReducedMotion) {
			time = 100;
			drawWaves(false);
		} else {
			const draw = () => {
				drawWaves(true);
				time++;
				animationId = requestAnimationFrame(draw);
			};
			draw();
		}

		return () => {
			window.removeEventListener("resize", resize);
			cancelAnimationFrame(animationId);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
			style={{ filter: "blur(50px)" }}
		/>
	);
};
