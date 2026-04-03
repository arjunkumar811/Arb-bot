import { VersionedTransaction } from "@solana/web3.js";
import { connection, walletKeypair } from "../config/rpc";
import { settings } from "../config/settings";
import { retry, withTimeout } from "../utils/retry";

type JupiterSwapResponse = {
	swapTransaction: string;
	lastValidBlockHeight: number;
};

const JUPITER_SWAP_URL = "https://quote-api.jup.ag/v6/swap";

export type SwapResult = {
	signature: string;
	lastValidBlockHeight: number;
};

export async function executeSwap(
	quoteResponse: unknown,
	maxRetries = settings.swapRetries
): Promise<SwapResult> {
	const isSlippageError = (error: Error): boolean =>
		error.message.toLowerCase().includes("slippage");

	const performSwap = async (): Promise<SwapResult> => {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), settings.swapTimeoutMs);
		let swapResponse: Response;
		try {
			swapResponse = await fetch(JUPITER_SWAP_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					quoteResponse,
					userPublicKey: walletKeypair.publicKey.toBase58(),
					wrapAndUnwrapSol: true,
				}),
				signal: controller.signal,
			});
		} catch (error) {
			if (controller.signal.aborted) {
				throw new Error("Jupiter swap timed out");
			}
			throw error;
		} finally {
			clearTimeout(timer);
		}

		if (!swapResponse.ok) {
			const text = await swapResponse.text();
			if (text.toLowerCase().includes("slippage")) {
				throw new Error("Swap failed due to slippage");
			}
			throw new Error(`Jupiter swap failed: ${swapResponse.status} ${text}`);
		}

		const data = (await swapResponse.json()) as JupiterSwapResponse;
		if (!data.swapTransaction) {
			throw new Error("Jupiter swap returned no transaction");
		}

		const tx = VersionedTransaction.deserialize(
			Buffer.from(data.swapTransaction, "base64")
		);
		tx.sign([walletKeypair]);

		const signature = await connection.sendTransaction(tx, {
			maxRetries: 2,
		});

		await withTimeout(
			connection.confirmTransaction({
				signature,
				lastValidBlockHeight: data.lastValidBlockHeight,
			}),
			settings.confirmTimeoutMs
		);

		return { signature, lastValidBlockHeight: data.lastValidBlockHeight };
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
