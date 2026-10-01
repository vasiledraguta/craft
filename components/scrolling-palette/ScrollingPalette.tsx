"use client";

import { useRef, useState } from "react";
import { useScroll, useSpring, useTransform, useMotionValueEvent } from "motion/react";
import { gradients } from "@/lib/gradients";
import { GradientList } from "./GradientList";
import { GradientDisplay } from "./GradientDisplay";

export function ScrollingPalette() {
	const containerRef = useRef<HTMLDivElement>(null);
	const [activeIndex, setActiveIndex] = useState(0);

	const { scrollYProgress } = useScroll({
		container: containerRef,
		offset: ["start start", "end end"],
	});

	const rawIndex = useTransform(
		scrollYProgress,
		gradients.map((_, i) => i / (gradients.length - 1)),
		gradients.map((_, i) => i)
	);

	const scrollIndex = useSpring(rawIndex, { stiffness: 300, damping: 30 });

	useMotionValueEvent(rawIndex, "change", (latest) => {
		const newIndex = Math.round(latest);
		if (newIndex >= 0 && newIndex < gradients.length) {
			setActiveIndex(newIndex);
		}
	});

	const currentGradient = gradients[activeIndex];

	return (
		<div
			ref={containerRef}
			className="relative h-screen w-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain"
		>
			<div className="sticky top-0 flex h-screen w-full items-center">
				<div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-8 px-4 md:flex-row md:justify-between md:gap-16 md:px-8 lg:px-16">
					<div className="order-1 flex w-full items-center justify-center md:order-2 md:flex-1">
						<GradientDisplay gradient={currentGradient} />
					</div>

					<div className="order-2 shrink-0 md:order-1">
						<GradientList
							gradients={gradients}
							activeIndex={activeIndex}
							scrollIndex={scrollIndex}
						/>
					</div>
				</div>
			</div>

			<div aria-hidden className="pointer-events-none absolute inset-x-0 top-0">
				{gradients.map((gradient) => (
					<div key={gradient.id} className="h-[30vh] snap-start" />
				))}
			</div>

			<div
				style={{
					height: `${(gradients.length - 1) * 30}vh`,
					pointerEvents: "none",
				}}
			/>
		</div>
	);
}
