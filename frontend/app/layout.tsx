import "../styles/globals.css";
import type { ReactNode } from "react";

export const metadata = {
	title: "Flash Loan Arb Dashboard",
	description: "Solana flash loan arbitrage dashboard",
};

type RootLayoutProps = {
	children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
