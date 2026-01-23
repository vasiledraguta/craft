interface SourceProps {
	href: string;
}

export default function Source({ href }: SourceProps) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="text-muted-foreground my-auto text-sm hover:underline"
		>
			source
		</a>
	);
}
