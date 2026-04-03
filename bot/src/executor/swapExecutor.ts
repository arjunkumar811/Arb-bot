import { VersionedTransaction } from "@solana/web3.js";
import { connection, walletKeypair } from "../config/rpc";

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
	maxRetries = 3
): Promise<SwapResult> {
	let attempt = 0;
	let lastError: Error | null = null;

	while (attempt < maxRetries) {
		try {
			const swapResponse = await fetch(JUPITER_SWAP_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					quoteResponse,
					userPublicKey: walletKeypair.publicKey.toBase58(),
					wrapAndUnwrapSol: true,
				}),
			});

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

			await connection.confirmTransaction({
				signature,
				lastValidBlockHeight: data.lastValidBlockHeight,
			});

			return { signature, lastValidBlockHeight: data.lastValidBlockHeight };
		} catch (error) {
			lastError = error as Error;
			attempt += 1;
			if (attempt >= maxRetries) {
				break;
			}
		}
	}

	throw lastError ?? new Error("Swap failed after retries");
}
