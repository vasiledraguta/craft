interface SourceProps {
	href: string;
}

export default function Source({ href }: SourceProps) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="my-auto text-sm text-(--color-text-tertiary) hover:underline"
		>
			source
		</a>
	);
}
