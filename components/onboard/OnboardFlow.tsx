"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, useRef, useCallback } from "react";
import { NameForm } from "./NameForm";

const helloMessages = [
	"hello",
	"hóla",
	"salut",
	"hallo",
	"bonjour",
	"ciao",
	"olá",
	"merhaba",
	"こんにちは",
	"안녕하세요",
	"你好",
];

const cubicBezierEaseInOut = { ease: [0.645, 0.045, 0.355, 1] } as const;

export const OnboardFlow = () => {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isHovered, setIsHovered] = useState(false);
	const [showForm, setShowForm] = useState(false);
	const [fontFamily] = useState(() => {
		if (typeof navigator !== "undefined") {
			const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
			return isSafari ? "var(--font-open-sans)" : "var(--font-dancing-script)";
		}
		return "var(--font-dancing-script)";
	});
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	const stopAutoRotate = useCallback(() => {
		if (intervalRef.current) {
			clearTimeout(intervalRef.current);
			intervalRef.current = null;
		}
	}, []);

	useEffect(() => {
		if (!isHovered && !showForm) {
			const letters = [...helloMessages[currentIndex]];
			// Animation completes at: 0.4s initial delay + (letters.length - 1) * 0.1s stagger + 0.5s duration
			const animationDuration = (0.4 + (letters.length - 1) * 0.1 + 0.5) * 1000;
			const displayDuration = 3000;
			const totalDelay = animationDuration + displayDuration;

			intervalRef.current = setTimeout(
				() => setCurrentIndex((i) => (i + 1) % helloMessages.length),
				totalDelay
			);
		}
		return stopAutoRotate;
	}, [currentIndex, isHovered, showForm, stopAutoRotate]);

	const handleClick = () => {
		if (!showForm) {
			stopAutoRotate();
			setIsHovered(false);
			setShowForm(true);
		}
	};

	const handleSubscribeComplete = useCallback(() => {
		setTimeout(() => {
			setShowForm(false);
			setIsHovered(false);
		}, 2000);
	}, []);

	const letters = [...helloMessages[currentIndex]];

	return (
		<div className="flex min-h-[120px] flex-col items-center justify-center px-4">
			<AnimatePresence mode="wait">
				{!showForm ? (
					<motion.div
						key="hello"
						className="relative flex cursor-pointer overflow-visible text-6xl select-none sm:text-8xl lg:text-9xl"
						onMouseEnter={() => setIsHovered(true)}
						onMouseLeave={() => setIsHovered(false)}
						onClick={handleClick}
						whileHover={{ scale: 1.05 }}
						transition={{ duration: 0.2, ...cubicBezierEaseInOut }}
						exit={{
							y: -60,
							opacity: 0,
							transition: { duration: 0.4, ...cubicBezierEaseInOut },
						}}
					>
						<AnimatePresence mode="wait">
							<motion.div
								key={currentIndex}
								className="flex overflow-visible"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								style={{ fontFamily, fontWeight: 400 }}
								suppressHydrationWarning
								exit={{
									opacity: 0.5,
									transition: { duration: 0.4, delay: letters.length * 0.1 },
								}}
							>
								{letters.map((letter, i) => (
									<motion.span
										key={i}
										className="inline-block"
										initial={{ opacity: 0, y: 50, scale: 0.5 }}
										animate={{
											opacity: 1,
											y: 0,
											scale: 1,
											transition: {
												duration: 0.5,
												delay: 0.4 + i * 0.1,
												...cubicBezierEaseInOut,
											},
										}}
										exit={{
											opacity: 0,
											y: -50,
											scale: 0.5,
											transition: {
												duration: 0.4,
												delay: (letters.length - 1 - i) * 0.1,
												...cubicBezierEaseInOut,
											},
										}}
									>
										{letter}
									</motion.span>
								))}
							</motion.div>
						</AnimatePresence>
						<AnimatePresence>
							{isHovered && (
								<motion.div
									className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap text-(--color-text-secondary) sm:-bottom-24 sm:text-sm"
									initial={{ opacity: 0, y: 10 }}
									animate={{
										opacity: 1,
										y: 0,
										transition: { duration: 0.3, ...cubicBezierEaseInOut },
									}}
									exit={{
										opacity: 0,
										y: 10,
										transition: { duration: 0.3, ...cubicBezierEaseInOut },
									}}
								>
									Click to introduce yourself
								</motion.div>
							)}
						</AnimatePresence>
					</motion.div>
				) : (
					<NameForm key="form" onComplete={handleSubscribeComplete} />
				)}
			</AnimatePresence>
		</div>
	);
};
