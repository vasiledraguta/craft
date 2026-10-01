import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import "./globals.css";

const newsreader = Newsreader({
	subsets: ["latin"],
	axes: ["opsz"],
	variable: "--font-newsreader",
});

export const metadata: Metadata = {
	title: "Craft",
	description: "showcase of my work",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={newsreader.variable}>
			<body className="antialiased">{children}</body>
		</html>
	);
}
