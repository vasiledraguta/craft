import { OnboardFlow } from "@/components/onboard/OnboardFlow";
import { Aurora } from "@/components/onboard/Aurora";
import Source from "@/components/Source";

const HelloPage = () => {
	return (
		<div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[--color-background] px-4">
			<Aurora />
			<div className="w-full max-w-4xl">
				<OnboardFlow />
			</div>
			<div className="absolute bottom-4">
				<Source href="https://github.com/vasiledraguta/craft/tree/main/components/onboard" />
			</div>
		</div>
	);
};

export default HelloPage;
