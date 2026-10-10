interface SourceProps {
	href: string;
}

export default function Source({ href }: SourceProps) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="my-auto rounded-sm text-sm text-(--color-text-tertiary) transition-colors duration-200 hover:text-(--color-interactive-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-foreground)"
		>
			source
		</a>
	);
}
