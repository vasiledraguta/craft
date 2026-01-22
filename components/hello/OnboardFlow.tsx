"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, useRef, useCallback } from "react";
import { SubscribeForm } from "./SubscribeForm";

const helloMessages = [
	"hello",
	"hola",
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

const easeOut = { ease: "easeOut" } as const;
const easeIn = { ease: "easeIn" } as const;

export const OnboardFlow = () => {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isHovered, setIsHovered] = useState(false);
	const [showForm, setShowForm] = useState(false);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	const stopAutoRotate = useCallback(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}, []);

	useEffect(() => {
		if (!isHovered && !showForm) {
			intervalRef.current = setInterval(
				() => setCurrentIndex((i) => (i + 1) % helloMessages.length),
				3000,
			);
		}
		return stopAutoRotate;
	}, [isHovered, showForm, stopAutoRotate]);

	const handleClick = () => {
		if (!showForm) {
			stopAutoRotate();
			setShowForm(true);
		}
	};

	const letters = [...helloMessages[currentIndex]];

	return (
		<div className="flex flex-col items-center justify-center min-h-[120px]">
			<AnimatePresence mode="wait">
				{!showForm ? (
					<motion.div
						key="hello"
						className="relative flex text-9xl cursor-pointer select-none overflow-visible"
						onMouseEnter={() => setIsHovered(true)}
						onMouseLeave={() => setIsHovered(false)}
						onClick={handleClick}
						whileHover={{ scale: 1.05 }}
						transition={{ duration: 0.2, ...easeOut }}
						exit={{
							y: -80,
							opacity: 0,
							transition: { duration: 0.4, ...easeIn },
						}}
					>
						<AnimatePresence mode="wait">
							<motion.div
								key={currentIndex}
								className="flex overflow-visible"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								style={{ fontFamily: "var(--font-pacifico)" }}
								exit={{
									opacity: 0.5,
									transition: { duration: 0.3, delay: letters.length * 0.1 },
								}}
							>
								{letters.map((letter, i) => (
									<motion.span
										key={i}
										className="inline-block"
										initial={{ opacity: 0, y: 80, scale: 0.5 }}
										animate={{
											opacity: 1,
											y: 0,
											scale: 1,
											transition: { duration: 0.5, delay: i * 0.1, ...easeOut },
										}}
										exit={{
											opacity: 0,
											y: -80,
											scale: 0.5,
											transition: {
												duration: 0.3,
												delay: (letters.length - 1 - i) * 0.1,
												...easeIn,
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
									className="absolute -bottom-24 left-1/2 -translate-x-1/2 text-sm text-(--color-text-secondary) whitespace-nowrap"
									initial={{ opacity: 0, y: 10 }}
									animate={{
										opacity: 1,
										y: 0,
										transition: { duration: 0.3, ...easeOut },
									}}
									exit={{
										opacity: 0,
										y: 10,
										transition: { duration: 0.2, ...easeIn },
									}}
								>
									Click to subscribe
								</motion.div>
							)}
						</AnimatePresence>
					</motion.div>
				) : (
					<SubscribeForm />
				)}
			</AnimatePresence>
		</div>
	);
};
