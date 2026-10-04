"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AsciiField } from "./AsciiField";

const springEase = [0.22, 1, 0.36, 1] as const;

const WAVE_CHARS = " .:-=+*#%@";
const WAVE_COLS = 33;
const WAVE_ROWS = 5;

type Photo = {
	id: number;
	name: string;
	bitmap: ImageBitmap;
};

function CharacterWave({ active }: { active: boolean }) {
	const ref = useRef<HTMLSpanElement>(null);
	const activeRef = useRef(active);
	const prefersReducedMotion = useReducedMotion() ?? false;

	useEffect(() => {
		activeRef.current = active;
	}, [active]);

	useEffect(() => {
		const element = ref.current;
		if (!element) return;
		let gain = activeRef.current ? 1 : 0.6;

		const render = (time: number) => {
			gain += ((activeRef.current ? 1 : 0.6) - gain) * 0.08;
			const lines: string[] = [];
			for (let row = 0; row < WAVE_ROWS; row++) {
				let line = "";
				const rowEnvelope = Math.sin((Math.PI * (row + 0.5)) / WAVE_ROWS);
				for (let col = 0; col < WAVE_COLS; col++) {
					const colEnvelope = Math.sin((Math.PI * (col + 0.5)) / WAVE_COLS);
					const wave = (Math.sin(time / 600 - col * 0.45 + row * 0.7) + 1) / 2;
					const value = wave * rowEnvelope * colEnvelope * gain;
					line += WAVE_CHARS[Math.round(value * (WAVE_CHARS.length - 1))];
				}
				lines.push(line);
			}
			element.textContent = lines.join("\n");
		};

		if (prefersReducedMotion) {
			render(0);
			return;
		}

		let frameId = 0;
		const loop = (time: number) => {
			render(time);
			frameId = requestAnimationFrame(loop);
		};
		frameId = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(frameId);
	}, [prefersReducedMotion]);

	return (
		<span
			ref={ref}
			aria-hidden
			className="block font-[ui-monospace,SFMono-Regular,Menlo,monospace] text-xs leading-none whitespace-pre text-(--color-text-tertiary)"
		/>
	);
}

export function AsciiPhoto() {
	const inputRef = useRef<HTMLInputElement>(null);
	const [photo, setPhoto] = useState<Photo | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [dragging, setDragging] = useState(false);
	const [hovering, setHovering] = useState(false);

	const loadFile = useCallback(async (file: File) => {
		try {
			const bitmap = await createImageBitmap(file);
			setError(null);
			setPhoto((previous) => ({ id: (previous?.id ?? 0) + 1, name: file.name, bitmap }));
		} catch {
			setError("That file couldn't be read as an image.");
		}
	}, []);

	const onChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (file) loadFile(file);
	};

	useEffect(() => {
		let depth = 0;
		const hasFiles = (event: DragEvent) => event.dataTransfer?.types.includes("Files") ?? false;

		const onDragEnter = (event: DragEvent) => {
			if (!hasFiles(event)) return;
			depth++;
			setDragging(true);
		};

		const onDragOver = (event: DragEvent) => {
			if (hasFiles(event)) event.preventDefault();
		};

		const onDragLeave = (event: DragEvent) => {
			if (!hasFiles(event)) return;
			depth = Math.max(0, depth - 1);
			if (depth === 0) setDragging(false);
		};

		const onDrop = (event: DragEvent) => {
			if (!hasFiles(event)) return;
			event.preventDefault();
			depth = 0;
			setDragging(false);
			const file = event.dataTransfer?.files[0];
			if (file) loadFile(file);
		};

		const onPaste = (event: ClipboardEvent) => {
			const file = Array.from(event.clipboardData?.files ?? []).find((item) =>
				item.type.startsWith("image/")
			);
			if (!file) return;
			event.preventDefault();
			loadFile(file);
		};

		window.addEventListener("dragenter", onDragEnter);
		window.addEventListener("dragover", onDragOver);
		window.addEventListener("dragleave", onDragLeave);
		window.addEventListener("drop", onDrop);
		window.addEventListener("paste", onPaste);
		return () => {
			window.removeEventListener("dragenter", onDragEnter);
			window.removeEventListener("dragover", onDragOver);
			window.removeEventListener("dragleave", onDragLeave);
			window.removeEventListener("drop", onDrop);
			window.removeEventListener("paste", onPaste);
		};
	}, [loadFile]);

	return (
		<motion.div
			layout
			transition={{ duration: 0.3, ease: springEase }}
			className={`flex w-full flex-col items-center gap-8 ${photo ? "" : "my-auto"}`}
		>
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
						className="flex w-full flex-col items-center gap-8 text-center"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.15, ease: springEase }}
					>
						<div className="flex flex-col gap-2">
							<h1 className="text-2xl tracking-tight text-(--color-foreground)">ASCII Photo</h1>
							<p className="text-base text-(--color-text-secondary)">
								Turn a photo into characters you can push around.
							</p>
						</div>
						<button
							type="button"
							onClick={() => inputRef.current?.click()}
							onPointerEnter={() => setHovering(true)}
							onPointerLeave={() => setHovering(false)}
							className={`flex w-full max-w-md cursor-pointer flex-col items-center gap-6 rounded-2xl border border-dashed px-6 py-10 transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-foreground) active:scale-[0.98] ${dragging ? "border-(--color-foreground) bg-(--color-surface)" : "border-(--color-border-hover) hover:border-(--color-interactive) hover:bg-(--color-surface)"}`}
						>
							<CharacterWave active={dragging || hovering} />
							<span className="flex flex-col gap-1">
								<span className="text-sm text-(--color-foreground)">
									{dragging ? "Drop it here" : "Add photo"}
								</span>
								<span className="text-sm text-(--color-text-tertiary)">
									<span className="hidden pointer-fine:inline">
										Drag an image here, paste one, or click to choose
									</span>
									<span className="pointer-fine:hidden">Tap to choose a photo</span>
								</span>
							</span>
						</button>
					</motion.div>
				)}
			</AnimatePresence>

			<motion.div
				layout="position"
				transition={{ duration: 0.3, ease: springEase }}
				className="flex flex-col items-center gap-3"
			>
				<input
					ref={inputRef}
					type="file"
					accept="image/*"
					className="sr-only"
					tabIndex={-1}
					onChange={onChange}
				/>
				{photo && (
					<button
						type="button"
						onClick={() => inputRef.current?.click()}
						className="cursor-pointer rounded-lg bg-(--color-surface) px-4 py-2 text-sm text-(--color-foreground) transition duration-200 hover:text-(--color-interactive-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-foreground) active:scale-95"
					>
						Change photo
					</button>
				)}
				<p aria-live="polite" className="min-h-5 text-sm text-(--color-text-secondary)">
					{error}
				</p>
			</motion.div>
		</motion.div>
	);
}
