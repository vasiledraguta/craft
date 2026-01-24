import type { Metadata } from "next";
import { Dancing_Script } from "next/font/google";
import "./globals.css";

const dancingScript = Dancing_Script({
	weight: ["400", "500", "600", "700"],
	subsets: ["latin"],
	variable: "--font-dancing-script",
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
		<html lang="en">
			<body className={`${dancingScript.variable} antialiased`}>{children}</body>
		</html>
	);
}
