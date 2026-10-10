import { ScrollingPalette } from "@/components/scrolling-palette/ScrollingPalette";
import type { Metadata } from "next";
import Source from "@/components/Source";

export const metadata: Metadata = { title: "Scrolling Palette" };

export default function ScrollingPalettePage() {
	return (
		<main className="relative h-screen w-full bg-(--color-background)">
			<ScrollingPalette />
			<div className="absolute bottom-4 left-1/2 -translate-x-1/2">
				<Source href="https://github.com/vasiledraguta/craft/tree/main/components/scrolling-palette" />
			</div>
		</main>
	);
}
