"use client";

import { motion, AnimatePresence } from "motion/react";
import type { GradientDefinition } from "@/lib/gradients";

const springEase = [0.22, 1, 0.36, 1] as const;

interface GradientDisplayProps {
	gradient: GradientDefinition;
}

export function GradientDisplay({ gradient }: GradientDisplayProps) {
	return (
		<div className="relative w-full max-w-[500px]">
			<div className="relative aspect-square w-full overflow-hidden rounded-2xl md:rounded-3xl">
				<AnimatePresence mode="popLayout">
					<motion.div
						key={gradient.id}
						className="absolute inset-0"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{
							duration: 0.15,
							ease: springEase,
						}}
						style={{
							background: gradient.background,
							backgroundSize: "cover",
						}}
					/>
				</AnimatePresence>

				<div
					className="pointer-events-none absolute inset-0 rounded-2xl md:rounded-3xl"
					style={{
						boxShadow: "inset 0 0 60px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.08)",
					}}
				/>

				<div
					className="pointer-events-none absolute inset-0 opacity-55 mix-blend-overlay"
					style={{
						backgroundImage: "url(/grain.svg)",
						backgroundSize: "160px 160px",
					}}
				/>
			</div>

			<div className="mt-4 h-5 overflow-hidden md:mt-6 md:h-6">
				<AnimatePresence mode="popLayout">
					<motion.p
						key={gradient.id}
						className="text-center text-xs text-(--color-text-secondary) md:text-sm"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.12, ease: springEase }}
					>
						{gradient.description}
					</motion.p>
				</AnimatePresence>
			</div>
		</div>
	);
}
