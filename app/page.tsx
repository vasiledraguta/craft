"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Links } from "@/components/Links";

const projects = [
	{ name: "Onboard Flow", href: "/onboard", external: false },
	{ name: "Grid Patterns", href: "/grid", external: false },
];

export default function Home() {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setMounted(true), 10);
		return () => clearTimeout(timer);
	}, []);

	return (
		<div className="flex min-h-screen items-center justify-center px-6 py-12">
			<div
				className={`w-full max-w-2xl transition-all duration-700 ease-out ${
					mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0 blur-sm"
				}`}
			>
				<header className="mb-12">
					<h1 className="mb-4 text-2xl tracking-tight text-(--color-foreground) sm:text-2xl">
						@vasiledraguta
					</h1>
					<p className="mb-4 text-base leading-relaxed text-(--color-text-secondary)">
						&quot;Everything you can imagine is real.&quot; — Pablo Picasso
					</p>
					<Links align="left" />
				</header>

				<nav>
					<ul className="space-y-1">
						{projects.map((project, index) => (
							<li
								key={project.name}
								className={`transition-all duration-700 ease-out ${
									mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0 blur-sm"
								}`}
								style={{
									transitionDelay: mounted ? `${100 + index * 50}ms` : "0ms",
								}}
							>
								<Link
									href={project.href}
									className="group -mx-4 flex items-center rounded-lg px-4 py-3 transition-colors duration-200 hover:bg-(--color-surface)"
								>
									<span className="font-medium text-(--color-foreground) transition-colors duration-200 group-hover:text-(--color-interactive-hover)">
										{project.name}
									</span>
									<svg
										className="ml-2 h-4 w-4 text-(--color-text-tertiary) transition-transform duration-200 group-hover:translate-x-1"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										strokeWidth={2}
									>
										<path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
									</svg>
								</Link>
							</li>
						))}
					</ul>
				</nav>
			</div>
		</div>
	);
}
