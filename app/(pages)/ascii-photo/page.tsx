import { AsciiPhoto } from "@/components/ascii-photo/AsciiPhoto";
import Source from "@/components/Source";

export default function AsciiPhotoPage() {
	return (
		<main className="flex min-h-screen w-full flex-col px-6 pt-24 pb-4">
			<AsciiPhoto />
			<div className="mt-auto flex justify-center pt-24">
				<Source href="https://github.com/vasiledraguta/craft/tree/main/components/ascii-photo" />
			</div>
		</main>
	);
}
