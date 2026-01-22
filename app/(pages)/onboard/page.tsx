import { OnboardFlow } from "@/components/onboard/OnboardFlow";
import { Aurora } from "@/components/onboard/Aurora";
import Source from "@/components/Source";

const HelloPage = () => {
  return (
    <div className="min-h-screen bg-[--color-background] flex items-center justify-center relative overflow-hidden px-4">
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
