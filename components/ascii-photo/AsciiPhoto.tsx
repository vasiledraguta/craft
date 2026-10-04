"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AsciiField } from "./AsciiField";

const springEase = [0.22, 1, 0.36, 1] as const;

type Photo = {
	id: number;
	name: string;
	bitmap: ImageBitmap;
};

export function AsciiPhoto() {
	const inputRef = useRef<HTMLInputElement>(null);
	const [photo, setPhoto] = useState<Photo | null>(null);
	const [error, setError] = useState<string | null>(null);

	const onChange = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file) return;

		try {
			const bitmap = await createImageBitmap(file);
			setError(null);
			setPhoto((previous) => ({ id: (previous?.id ?? 0) + 1, name: file.name, bitmap }));
		} catch {
			setError("That file couldn't be read as an image.");
		}
	};

	return (
		<div className="flex flex-col items-center gap-8">
			<AnimatePresence mode="wait" initial={false}>
				{photo ? (
					<motion.div
						key={photo.id}
						className="w-full"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.15, ease: springEase }}
					>
						<AsciiField image={photo.bitmap} label={`ASCII rendering of ${photo.name}`} />
					</motion.div>
				) : (
					<motion.div
						key="empty"
						className="flex aspect-[4/3] w-full max-w-md items-center justify-center rounded-2xl border border-dashed border-(--color-border-hover) px-6 text-center text-sm text-(--color-text-secondary)"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.15, ease: springEase }}
					>
						Pick a photo to turn it into characters, then move your cursor through it.
					</motion.div>
				)}
			</AnimatePresence>

			<div className="flex flex-col items-center gap-3">
				<input
					ref={inputRef}
					type="file"
					accept="image/*"
					className="sr-only"
					tabIndex={-1}
					onChange={onChange}
				/>
				<button
					type="button"
					onClick={() => inputRef.current?.click()}
					className="rounded-lg bg-(--color-surface) px-4 py-2 text-sm text-(--color-foreground) transition-colors duration-200 hover:text-(--color-interactive-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-foreground)"
				>
					{photo ? "Change photo" : "Add photo"}
				</button>
				<p aria-live="polite" className="min-h-5 text-sm text-(--color-text-secondary)">
					{error}
				</p>
			</div>
		</div>
	);
}
