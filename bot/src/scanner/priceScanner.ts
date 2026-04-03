import { settings } from "../config/settings";
import { fetchQuote, JupiterQuote } from "../dex/jupiterClient";

export type PriceQuote = {
	inputMint: string;
	outputMint: string;
	inAmount: bigint;
	outAmount: bigint;
	price: number;
	priceImpactPct: number;
	route: JupiterQuote;
};

export async function getQuote(
	inputMint: string,
	outputMint: string,
	amount: bigint,
	slippageBps = settings.slippageBps,
	timeoutMs = settings.quoteTimeoutMs
): Promise<PriceQuote> {
	const best = await fetchQuote(
		inputMint,
		outputMint,
		amount,
		slippageBps,
		timeoutMs
	);

	const inAmount = BigInt(best.inAmount);
	const outAmount = BigInt(best.outAmount);
	const price = Number(outAmount) / Number(inAmount || 1n);
	const priceImpactPct = Number(best.priceImpactPct || 0);

	return {
		inputMint: best.inputMint,
		outputMint: best.outputMint,
		inAmount,
		outAmount,
		price,
		priceImpactPct,
		route: best,
	};
}
