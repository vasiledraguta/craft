import type { Metadata } from "next";
import Source from "@/components/Source";
import { ZipperHeart } from "@/components/zipper-heart/ZipperHeart";

export const metadata: Metadata = { title: "Zipper Heart" };

export default function ZipperHeartPage() {
	return (
		<main className="flex min-h-screen w-full flex-col px-6 pt-24 pb-4">
			<ZipperHeart />
			<div className="mt-auto flex justify-center pt-24">
				<Source href="https://github.com/vasiledraguta/craft/tree/main/components/zipper-heart" />
			</div>
		</main>
	);
}
