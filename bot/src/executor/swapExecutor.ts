import { JupiterQuote } from "../dex/jupiterClient";
import { executeDexSwap } from "../dex/dexExecutor";

export type SwapResult = {
	signature: string;
	success: boolean;
};

// Execute a Jupiter swap and report whether it was confirmed.
export async function executeSwap(
	quoteResponse: JupiterQuote
): Promise<SwapResult> {
	const result = await executeDexSwap(quoteResponse);
	return { signature: result.signature, success: true };
}
