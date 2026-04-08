"use client";

import { useEffect, useRef, useState } from "react";
import {
	Connection,
	LAMPORTS_PER_SOL,
	PublicKey,
	Transaction,
} from "@solana/web3.js";
import {
	createAssociatedTokenAccountInstruction,
	getAssociatedTokenAddress,
} from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { initWallet } from "../../lib/api";

const WalletMultiButton = dynamic(
	async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
	{ ssr: false }
);

const USDC_MINT = "EPjFWdd5AufqSSqeM2q8kP9Rwx8wZMBZ9K9J8sWq5uV";
const USDT_MINT = "Es9vMFrzaCERp8hZpC1ZK4n5Vf3L7h4r9JQq9VHtV";
const MIN_SOL_BALANCE = 0.05;

type WalletAccounts = {
	address: string;
	usdcAccount: string;
	usdtAccount: string;
};

async function ensureMintOnCluster(
	connection: Connection,
	mintAddress: string,
	label: string
): Promise<void> {
	const mint = new PublicKey(mintAddress);
	const info = await connection.getAccountInfo(mint);
	if (!info) {
		throw new Error(
			`${label} mint not found on this RPC. Switch to mainnet or update NEXT_PUBLIC_RPC_URL.`
		);
	}
}

async function ensureAssociatedTokenAccount(
	connection: Connection,
	owner: PublicKey,
	sendTransaction: (
		transaction: Transaction,
		connection: Connection
	) => Promise<string>,
	mintAddress: string,
	label: string,
	canCreate: boolean
): Promise<PublicKey> {
	const mint = new PublicKey(mintAddress);
	const ata = await getAssociatedTokenAddress(mint, owner);
	const accountInfo = await connection.getAccountInfo(ata);

	if (accountInfo) {
		console.log(`${label} ATA ready`);
		return ata;
	}

	if (!canCreate) {
		throw new Error("Insufficient SOL balance (< 0.05 SOL)");
	}

	const ix = createAssociatedTokenAccountInstruction(owner, ata, owner, mint);
	const tx = new Transaction().add(ix);
	try {
		const signature = await sendTransaction(tx, connection);
		await connection.confirmTransaction(signature, "confirmed");
	} catch (error) {
		throw new Error(
			`Failed to create ${label} ATA: ${(error as Error).message ?? "unknown error"}`
		);
	}

	console.log(`${label} ATA ready`);
	return ata;
}

export function WalletStatus(): JSX.Element {
	const { connection } = useConnection();
	const { publicKey, connected, sendTransaction } = useWallet();
	const [balance, setBalance] = useState<number | null>(null);
	const [walletInfo, setWalletInfo] = useState<WalletAccounts | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [warning, setWarning] = useState<string | null>(null);
	const initRef = useRef<string | null>(null);

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

	useEffect(() => {
		let active = true;

		const initializeWallet = async (): Promise<void> => {
			if (!publicKey || !connected) {
				initRef.current = null;
				setWalletInfo(null);
				setError("Wallet not connected");
				return;
			}

			const walletAddress = publicKey.toBase58();
			if (initRef.current === walletAddress) return;

			initRef.current = walletAddress;
			setLoading(true);
			setError(null);
			setWarning(null);

			console.log("Wallet connected");

			try {
				const lamports = await connection.getBalance(publicKey);
				const solBalance = lamports / LAMPORTS_PER_SOL;
				if (!active) return;
				setBalance(solBalance);
				const canCreate = solBalance >= MIN_SOL_BALANCE;
				if (!canCreate) {
					setWarning("Insufficient SOL balance (< 0.05 SOL)");
				}

				await ensureMintOnCluster(connection, USDC_MINT, "USDC");
				await ensureMintOnCluster(connection, USDT_MINT, "USDT");

				const usdcAta = await ensureAssociatedTokenAccount(
					connection,
					publicKey,
					sendTransaction,
					USDC_MINT,
					"USDC",
					canCreate
				);
				const usdtAta = await ensureAssociatedTokenAccount(
					connection,
					publicKey,
					sendTransaction,
					USDT_MINT,
					"USDT",
					canCreate
				);

				if (!active) return;
				const info: WalletAccounts = {
					address: walletAddress,
					usdcAccount: usdcAta.toBase58(),
					usdtAccount: usdtAta.toBase58(),
				};
				setWalletInfo(info);

				await initWallet({
					wallet: info.address,
					usdcAccount: info.usdcAccount,
					usdtAccount: info.usdtAccount,
				});
			} catch (err) {
				if (!active) return;
				setError((err as Error).message);
			} finally {
				if (active) setLoading(false);
			}
		};

		void initializeWallet();

		return () => {
			active = false;
		};
	}, [connection, connected, publicKey, sendTransaction]);

	return (
		<div className="flex flex-col items-end gap-2">
			<div className="flex items-center gap-3">
				<WalletMultiButton className="!rounded-lg !bg-slate-800 !text-xs !text-slate-100 hover:!bg-slate-700" />
				<div className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-200">
					{balance === null ? "-- SOL" : `${balance.toFixed(3)} SOL`}
				</div>
			</div>
			<div className="w-full min-w-[280px] rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-xs text-slate-300">
				<div className="flex items-center justify-between gap-3">
					<span className="text-slate-500">Wallet</span>
					<span className="break-all text-right text-slate-200">
						{walletInfo?.address ?? "Not connected"}
					</span>
				</div>
				<div className="mt-2 flex items-center justify-between gap-3">
					<span className="text-slate-500">USDC ATA</span>
					<span className="break-all text-right text-slate-200">
						{walletInfo?.usdcAccount ?? "--"}
					</span>
				</div>
				<div className="mt-2 flex items-center justify-between gap-3">
					<span className="text-slate-500">USDT ATA</span>
					<span className="break-all text-right text-slate-200">
						{walletInfo?.usdtAccount ?? "--"}
					</span>
				</div>
				{loading ? (
					<div className="mt-3 text-xs text-slate-400">Initializing…</div>
				) : null}
				{warning ? (
					<div className="mt-2 text-xs text-amber-400">{warning}</div>
				) : null}
				{error ? (
					<div className="mt-2 text-xs text-rose-400">{error}</div>
				) : null}
			</div>
		</div>
	);
}
