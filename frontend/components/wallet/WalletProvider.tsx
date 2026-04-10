"use client";

import { ReactNode, useMemo } from "react";
import { clusterApiUrl } from "@solana/web3.js";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { RPC_URL } from "../../lib/solanaConfig";

type WalletContextProviderProps = {
	children: ReactNode;
};

export function WalletContextProvider({
	children,
}: WalletContextProviderProps): JSX.Element {
	const endpoint = RPC_URL || clusterApiUrl("devnet");
	const wallets = useMemo(
		() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
		[]
	);

	return (
		<ConnectionProvider endpoint={endpoint}>
			<WalletProvider
				wallets={wallets}
				autoConnect={false}
				onError={(error) => {
					console.warn("Wallet adapter error", error);
				}}
			>
				<WalletModalProvider>{children}</WalletModalProvider>
			</WalletProvider>
		</ConnectionProvider>
	);
}
