import "../styles/globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import type { ReactNode } from "react";
import { WalletContextProvider } from "../components/wallet";

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
			<body>
				<WalletContextProvider>{children}</WalletContextProvider>
			</body>
		</html>
	);
}
