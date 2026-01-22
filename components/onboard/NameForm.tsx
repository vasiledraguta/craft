"use client";

import { type FormEvent, useState, useEffect } from "react";
import { motion } from "motion/react";

interface NameFormProps {
	onComplete?: () => void;
}

export const NameForm = ({ onComplete }: NameFormProps) => {
	const [name, setName] = useState("");
	const [isFlipped, setIsFlipped] = useState(false);

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		console.log("Name submitted:", name);
		setIsFlipped(true);
	};

	useEffect(() => {
		if (isFlipped && onComplete) {
			const timer = setTimeout(() => {
				onComplete();
			}, 1500);
			return () => clearTimeout(timer);
		}
	}, [isFlipped, onComplete]);

	const easeOut = { ease: "easeOut" } as const;


	return (
		<motion.div
			initial={{ y: 40, opacity: 0, scale: 0.9 }}
			animate={{ y: 0, opacity: 1, scale: 1, transition: { duration: 0.4, ...easeOut } }}
			exit={{ y: 40, opacity: 0, scale: 0.9, transition: { duration: 0.4, ...easeOut } }}
			style={{
				perspective: "1200px",
				willChange: 'transform'
			}}
		>
			<motion.div
				animate={{ rotateY: isFlipped ? 180 : 0 }}
				transition={{ duration: 1.2, ease: [0.645, 0.045, 0.355, 1] }}
				style={{
					transformStyle: "preserve-3d",
					position: "relative",
				}}
			>
				<div
					style={{
						backfaceVisibility: "hidden",
						transform: 'translateZ(0)',
						willChange: 'background-image'
					}}
					className="p-3 rounded-3xl
					bg-linear-to-b from-[#f0f0f0] to-[#e4e4e4]
					dark:from-[#2a2a2a] dark:to-[#1e1e1e]
					border border-(--color-border)
					shadow-[0_4px_16px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(0,0,0,0.05)]
					dark:shadow-[0_4px_16px_rgba(0,0,0,0.4),0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-1px_0_rgba(0,0,0,0.3)]"
				>
					<form
						onSubmit={handleSubmit}
						className="relative flex items-center w-full sm:min-w-[500px]
						rounded-2xl
						bg-linear-to-b from-[#e8e8e8] to-[#f5f5f5]
						dark:from-[#151515] dark:to-[#1a1a1a]
						border border-[#d0d0d0] dark:border-[#252525]
						shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(0,0,0,0.08)]
						dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(0,0,0,0.3)]"
					>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="How do I call you?"
							aria-label="Name"
							required
							className="flex-1 px-4 sm:px-8 py-4 sm:py-6 text-lg sm:text-2xl bg-transparent
							text-(--color-foreground) placeholder-(--color-text-secondary)
							focus:outline-none selection:text-(--color-foreground) selection:bg-(--color-border)"
						/>
						<button
							type="submit"
							className="mr-2 sm:mr-3 px-4 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-xl font-medium cursor-pointer
							bg-linear-to-b from-[#fafafa] to-[#e8e8e8]
							dark:from-[#3a3a3a] dark:to-[#2a2a2a]
							border border-[#d0d0d0] dark:border-[#404040]
							shadow-[0_2px_4px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(0,0,0,0.05)]
							dark:shadow-[0_2px_4px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.2)]
							text-(--color-foreground)
							hover:from-[#ffffff] hover:to-[#f0f0f0]
							dark:hover:from-[#454545] dark:hover:to-[#353535]
							hover:shadow-[0_3px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(0,0,0,0.05)]
							dark:hover:shadow-[0_3px_6px_rgba(0,0,0,0.4),0_2px_4px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.2)]
							active:from-[#e8e8e8] active:to-[#f5f5f5]
							dark:active:from-[#2a2a2a] dark:active:to-[#353535]
							active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(0,0,0,0.08)]
							dark:active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(0,0,0,0.3)]
							transition-all duration-150 whitespace-nowrap"
						>
							Continue
						</button>
					</form>
				</div>

				<div
					style={{
						backfaceVisibility: "hidden",
						transform: 'rotateY(180deg) translateZ(0)',
						willChange: 'background-image',
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
					}}
					className="p-3 rounded-3xl
					bg-linear-to-b from-[#f0f0f0] to-[#e4e4e4]
					dark:from-[#2a2a2a] dark:to-[#1e1e1e]
					border border-(--color-border)
					shadow-[0_4px_16px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(0,0,0,0.05)]
					dark:shadow-[0_4px_16px_rgba(0,0,0,0.4),0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-1px_0_rgba(0,0,0,0.3)]"
				>
					<div className="flex items-center justify-center w-full sm:min-w-[500px] h-[60px] sm:h-[72px] rounded-2xl px-4
						bg-linear-to-b from-[#e8e8e8] to-[#f5f5f5]
						dark:from-[#151515] dark:to-[#1a1a1a]
						border border-[#d0d0d0] dark:border-[#252525]
						shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(0,0,0,0.08)]
						dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(0,0,0,0.3)]"
					>
						<motion.div
							initial={{ opacity: 0, y: 20, scale: 0.9, filter: "blur(8px)" }}
							animate={isFlipped ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" } : { opacity: 0, y: 20, scale: 0.9, filter: "blur(8px)" }}
							transition={{ delay: 0.6, duration: 0.5, ...easeOut }}
							className="text-lg sm:text-2xl text-(--color-foreground) text-center"
						>
							Nice to meet you, {name}!
						</motion.div>
					</div>
				</div>
			</motion.div>
		</motion.div>
	);
};
