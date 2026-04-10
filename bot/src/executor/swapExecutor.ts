import { JupiterQuote } from "../dex/jupiterClient";
import { executeDexSwap } from "../dex/dexExecutor";
import { logSwap, logTransaction } from "../utils/logger";

export type SwapResult = {
	signature: string;
	success: boolean;
};

// Execute a Jupiter swap and report whether it was confirmed.
export async function executeSwap(
	quoteResponse: JupiterQuote
): Promise<SwapResult> {
	const result = await executeDexSwap(quoteResponse);
	logTransaction(result.signature, "jupiter-swap");
	logSwap(result.signature, "Jupiter swap executed");
	return { signature: result.signature, success: true };
}
