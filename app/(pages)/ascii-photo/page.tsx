import { AsciiPhoto } from "@/components/ascii-photo/AsciiPhoto";
import Source from "@/components/Source";

export default function AsciiPhotoPage() {
	return (
		<main className="mx-auto w-full max-w-4xl px-6 py-24">
			<AsciiPhoto />
			<div className="mt-24 flex justify-center">
				<Source href="https://github.com/vasiledraguta/craft/tree/main/components/ascii-photo" />
			</div>
		</main>
	);
}
