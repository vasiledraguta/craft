"use client";

import { type FormEvent, useState } from "react";
import { motion } from "motion/react";

export const SubscribeForm = () => {
	const [email, setEmail] = useState("");

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		console.log("Email submitted:", email);
	};

	const easeOut = { ease: "easeOut" } as const;

	return (
		<motion.div
			initial={{ y: 40, opacity: 0.7, scale: 0.9 }}
			animate={{ y: 0, opacity: 1, scale: 1 }}
			transition={{ duration: 0.3, ...easeOut }}
			style={{ willChange: 'transform' }}
		>
			<div
				style={{ transform: 'translateZ(0)', willChange: 'background-image' }}
				className="p-3 rounded-3xl
				bg-linear-to-b from-[#f0f0f0] to-[#e4e4e4]
				dark:from-[#2a2a2a] dark:to-[#1e1e1e]
				border border-(--color-border)
				shadow-[0_4px_16px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(0,0,0,0.05)]
				dark:shadow-[0_4px_16px_rgba(0,0,0,0.4),0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-1px_0_rgba(0,0,0,0.3)]"
			>
			<form
				onSubmit={handleSubmit}
				className="relative flex items-center min-w-[500px]
				rounded-2xl
				bg-linear-to-b from-[#e8e8e8] to-[#f5f5f5]
				dark:from-[#151515] dark:to-[#1a1a1a]
				border border-[#d0d0d0] dark:border-[#252525]
				shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(0,0,0,0.08)]
				dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(0,0,0,0.3)]"
			>
				<input
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="your@email.com"
					aria-label="Email address"
					required
					className="flex-1 px-8 py-6 text-2xl bg-transparent
					text-(--color-foreground) placeholder-(--color-text-secondary)
					focus:outline-none selection:text-(--color-foreground) selection:bg-(--color-border)"
				/>
				<button
					type="submit"
					className="mr-3 px-6 py-3 text-base rounded-xl font-medium cursor-pointer
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
					transition-all duration-150"
				>
					Subscribe
				</button>
			</form>
			</div>
		</motion.div>
	);
};
