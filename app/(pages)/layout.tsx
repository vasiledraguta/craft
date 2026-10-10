export default function ExperimentLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="transition-[opacity,translate,filter] duration-700 ease-out starting:translate-y-6 starting:opacity-0 starting:blur-sm">
			{children}
		</div>
	);
}
