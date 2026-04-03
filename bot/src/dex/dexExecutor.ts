import { VersionedTransaction } from "@solana/web3.js";
import { connection, walletKeypair } from "../config/rpc";
import { settings } from "../config/settings";
import { retry, withTimeout } from "../utils/retry";
import { buildSwapTransaction, JupiterQuote } from "./jupiterClient";

export type DexSwapResult = {
	signature: string;
	lastValidBlockHeight: number;
};

export async function executeDexSwap(
	quote: JupiterQuote,
	maxRetries = settings.swapRetries
): Promise<DexSwapResult> {
	const isSlippageError = (error: Error): boolean =>
		error.message.toLowerCase().includes("slippage");

	const performSwap = async (): Promise<DexSwapResult> => {
		const swapTx = await buildSwapTransaction(quote, walletKeypair.publicKey.toBase58(), {
			wrapAndUnwrapSol: true,
			prioritizationFeeLamports:
				settings.priorityFeeMicroLamports > 0
					? Math.floor(settings.priorityFeeMicroLamports / 1_000_000)
					: undefined,
			computeUnitLimit:
				settings.computeUnitLimit > 0 ? settings.computeUnitLimit : undefined,
		});

		const tx = VersionedTransaction.deserialize(
			Buffer.from(swapTx.swapTransaction, "base64")
		);
		tx.sign([walletKeypair]);

		const signature = await connection.sendTransaction(tx, { maxRetries: 2 });
		const latestBlockhash = await connection.getLatestBlockhash();

		await withTimeout(
			connection.confirmTransaction({
				signature,
				blockhash: latestBlockhash.blockhash,
				lastValidBlockHeight: swapTx.lastValidBlockHeight,
			}),
			settings.confirmTimeoutMs
		);

		return { signature, lastValidBlockHeight: swapTx.lastValidBlockHeight };
	};

	return retry(performSwap, {
		retries: Math.max(0, maxRetries - 1),
		delayMs: 500,
		backoffFactor: 2,
		maxDelayMs: 5000,
		jitter: 0.2,
		shouldRetry: (error) => !isSlippageError(error),
	});
}
