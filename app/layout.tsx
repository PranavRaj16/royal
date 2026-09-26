import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Royal Jewellers | Luxury Jewellery Catalogue",
  description:
    "Explore our exquisite collection of handcrafted jewellery. Gold, diamonds, and gemstones crafted with timeless artistry.",
  openGraph: {
    title: "Royal Jewellers | Luxury Jewellery Catalogue",
    description:
      "Explore our exquisite collection of handcrafted jewellery. Gold, diamonds, and gemstones crafted with timeless artistry.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
