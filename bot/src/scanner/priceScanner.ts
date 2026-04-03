type QuoteResponse = {
	inputMint: string;
	outputMint: string;
	inAmount: string;
	outAmount: string;
	otherAmountThreshold: string;
	swapMode: string;
	slippageBps: number;
	priceImpactPct: string;
};

export type PriceQuote = {
	inputMint: string;
	outputMint: string;
	inAmount: bigint;
	outAmount: bigint;
	price: number;
	priceImpactPct: number;
};

const JUPITER_QUOTE_URL = "https://quote-api.jup.ag/v6/quote";

export async function getQuote(
	inputMint: string,
	outputMint: string,
	amount: bigint,
	slippageBps = 50
): Promise<PriceQuote> {
	const params = new URLSearchParams({
		inputMint,
		outputMint,
		amount: amount.toString(),
		slippageBps: slippageBps.toString(),
	});

	const response = await fetch(`${JUPITER_QUOTE_URL}?${params.toString()}`);
	if (!response.ok) {
		throw new Error(`Jupiter quote failed: ${response.status} ${response.statusText}`);
	}

	const data = (await response.json()) as { data: QuoteResponse[] };
	const best = data.data?.[0];
	if (!best) {
		throw new Error("Jupiter quote returned no routes");
	}

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
	};
}
