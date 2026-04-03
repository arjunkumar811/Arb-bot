import { JupiterQuote } from "../dex/jupiterClient";
import { executeDexSwap, DexSwapResult } from "../dex/dexExecutor";

export type SwapResult = DexSwapResult;

export async function executeSwap(quoteResponse: JupiterQuote): Promise<SwapResult> {
	return executeDexSwap(quoteResponse);
}
