import { fetchQuote, JupiterQuote } from "./jupiterClient";
import { emitEvent } from "../server/wsClient";
import { logInfo } from "../utils/logger";

export type SwapRoute = {
	quote: JupiterQuote;
	inputMint: string;
	outputMint: string;
	inAmount: bigint;
	outAmount: bigint;
};

function buildMockQuote(
	inputMint: string,
	outputMint: string,
	amount: bigint
): JupiterQuote {
	const outAmount = amount - amount / 200n; // -0.5% to avoid false profits
	return {
		inputMint,
		outputMint,
		inAmount: amount.toString(),
		outAmount: outAmount.toString(),
		otherAmountThreshold: (outAmount - outAmount / 100n).toString(),
		swapMode: "mock",
		slippageBps: 50,
		priceImpactPct: "0.005",
	};
}

export async function buildRoute(
	inputMint: string,
	outputMint: string,
	amount: bigint
): Promise<SwapRoute> {
	let quote: JupiterQuote;
	try {
		quote = await fetchQuote(inputMint, outputMint, amount);
	} catch (error) {
		logInfo("Route fallback to mock quote");
		quote = buildMockQuote(inputMint, outputMint, amount);
	}

	emitEvent("quote_update", {
		inputToken: inputMint,
		outputToken: outputMint,
		inputAmount: quote.inAmount,
		outputAmount: quote.outAmount,
		route: quote.swapMode,
		fee: quote.otherAmountThreshold,
	});
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
