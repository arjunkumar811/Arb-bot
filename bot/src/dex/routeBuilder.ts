import { fetchQuote, JupiterQuote } from "./jupiterClient";

export type SwapRoute = {
	quote: JupiterQuote;
	inputMint: string;
	outputMint: string;
	inAmount: bigint;
	outAmount: bigint;
};

export async function buildRoute(
	inputMint: string,
	outputMint: string,
	amount: bigint
): Promise<SwapRoute> {
	const quote = await fetchQuote(inputMint, outputMint, amount);
	return {
		quote,
		inputMint,
		outputMint,
		inAmount: BigInt(quote.inAmount),
		outAmount: BigInt(quote.outAmount),
	};
}

export async function buildDualRoute(
	mintA: string,
	mintB: string,
	amount: bigint
): Promise<{ forward: SwapRoute; backward: SwapRoute }> {
	const forward = await buildRoute(mintA, mintB, amount);
	const backward = await buildRoute(mintB, mintA, forward.outAmount);
	return { forward, backward };
}
