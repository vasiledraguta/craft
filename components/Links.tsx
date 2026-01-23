interface LinksProps {
	className?: string;
	align?: "left" | "center" | "right" | "start" | "end";
}

export const Links = ({ className = "", align = "center" }: LinksProps) => {
	const alignmentClasses = {
		left: "justify-start",
		center: "justify-center",
		right: "justify-end",
		start: "justify-start",
		end: "justify-end",
	};

	return (
		<div
			className={`flex items-center ${alignmentClasses[align]} gap-4 text-sm text-(--color-text-tertiary) ${className}`}
		>
			<a
				href="https://draguta.dev"
				target="_blank"
				rel="noopener noreferrer"
				className="ease transition-colors duration-200 hover:text-(--color-interactive-hover)"
			>
				me
			</a>
			<span className="text-(--color-text-tertiary)">•</span>
			<a
				href="https://github.com/vasiledraguta"
				target="_blank"
				rel="noopener noreferrer"
				className="ease transition-colors duration-200 hover:text-(--color-interactive-hover)"
			>
				github
			</a>
			<span className="text-(--color-text-tertiary)">•</span>
			<a
				href="https://x.com/vasiledraguta"
				target="_blank"
				rel="noopener noreferrer"
				className="ease transition-colors duration-200 hover:text-(--color-interactive-hover)"
			>
				X
			</a>
		</div>
	);
};
