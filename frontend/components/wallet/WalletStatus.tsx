"use client";

import { useEffect, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";

const WalletMultiButton = dynamic(
	async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
	{ ssr: false }
);

export function WalletStatus(): JSX.Element {
	const { connection } = useConnection();
	const { publicKey } = useWallet();
	const [balance, setBalance] = useState<number | null>(null);

	useEffect(() => {
		let active = true;

		const load = async (): Promise<void> => {
			if (!publicKey) {
				setBalance(null);
				return;
			}

			const lamports = await connection.getBalance(publicKey);
			if (!active) return;
			setBalance(lamports / LAMPORTS_PER_SOL);
		};

		load();
		const interval = setInterval(load, 20000);

		return () => {
			active = false;
			clearInterval(interval);
		};
	}, [connection, publicKey]);

	return (
		<div className="flex items-center gap-3">
			<WalletMultiButton className="!rounded-lg !bg-slate-800 !text-xs !text-slate-100 hover:!bg-slate-700" />
			<div className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-200">
				{balance === null ? "-- SOL" : `${balance.toFixed(3)} SOL`}
			</div>
		</div>
	);
}
