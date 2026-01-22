import type { Metadata } from "next";
import { Open_Sans, Pacifico
} from "next/font/google";
import "./globals.css";

const openSans = Open_Sans({
  weight: ["400", "700"],
  subsets: ["latin"],
});

const pacifico = Pacifico({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-pacifico",
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
      <body
        className={`${openSans.className} ${pacifico.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
