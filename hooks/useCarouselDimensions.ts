"use client";

import { useSyncExternalStore } from "react";

export interface CarouselDimensions {
	cardWidth: number;
	gap: number;
	itemSize: number;
}

const DEFAULT_CARD_WIDTH = 400;
const DEFAULT_GAP = 40;

const DEFAULT_DIMENSIONS: CarouselDimensions = {
	cardWidth: DEFAULT_CARD_WIDTH,
	gap: DEFAULT_GAP,
	itemSize: DEFAULT_CARD_WIDTH + DEFAULT_GAP,
};

function getCSSVariable(name: string, fallback: number): number {
	const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
	const parsed = parseInt(value, 10);
	return isNaN(parsed) ? fallback : parsed;
}

function getDimensions(): CarouselDimensions {
	const cardWidth = getCSSVariable("--carousel-card-width", DEFAULT_CARD_WIDTH);
	const gap = getCSSVariable("--carousel-gap", DEFAULT_GAP);
	return {
		cardWidth,
		gap,
		itemSize: cardWidth + gap,
	};
}

let cachedDimensions: CarouselDimensions = DEFAULT_DIMENSIONS;

function getSnapshot(): CarouselDimensions {
	const newDimensions = getDimensions();
	if (
		cachedDimensions.cardWidth !== newDimensions.cardWidth ||
		cachedDimensions.gap !== newDimensions.gap
	) {
		cachedDimensions = newDimensions;
	}
	return cachedDimensions;
}

function getServerSnapshot(): CarouselDimensions {
	return DEFAULT_DIMENSIONS;
}

function subscribe(callback: () => void): () => void {
	let timeoutId: ReturnType<typeof setTimeout>;
	const handleResize = () => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(callback, 150);
	};

	window.addEventListener("resize", handleResize);
	return () => {
		window.removeEventListener("resize", handleResize);
		clearTimeout(timeoutId);
	};
}

export function useCarouselDimensions(): CarouselDimensions {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
