const JUPITER_QUOTE_URL = "https://quote-api.jup.ag/v6/quote";

type RoutePlanStep = {
	swapInfo?: {
		label?: string;
		feeAmount?: string;
	};
};

export type JupiterQuote = {
	inputMint: string;
	outputMint: string;
	inAmount: string;
	outAmount: string;
	otherAmountThreshold: string;
	swapMode: string;
	slippageBps: number;
	priceImpactPct: string;
	routePlan?: RoutePlanStep[];
};

export type QuoteDetails = {
	route: JupiterQuote;
	bestRoute: string;
	feeAmount: string;
};

// Build a human-readable label from the Jupiter route plan.
function buildBestRouteLabel(route: JupiterQuote): string {
	const labels =
		route.routePlan
			?.map((step) => step.swapInfo?.label)
			.filter((label): label is string => Boolean(label)) ?? [];

	if (labels.length === 0) return "Jupiter";
	return Array.from(new Set(labels)).join(" -> ");
}

// Sum fee amounts reported by Jupiter route steps.
function sumRouteFees(route: JupiterQuote): string {
	const total =
		route.routePlan?.reduce((acc, step) => {
			const raw = step.swapInfo?.feeAmount;
			if (!raw) return acc;
			try {
				return acc + BigInt(raw);
			} catch {
				return acc;
			}
		}, 0n) ?? 0n;

	return total.toString();
}

// Fetch the best quote from Jupiter for a given mint pair and amount.
export async function fetchQuote(
	inputMint: string,
	outputMint: string,
	amount: bigint,
	slippageBps = 50
): Promise<QuoteDetails> {
	const params = new URLSearchParams({
		inputMint,
		outputMint,
		amount: amount.toString(),
		slippageBps: slippageBps.toString(),
	});

	const response = await fetch(`${JUPITER_QUOTE_URL}?${params.toString()}`);
	if (!response.ok) {
		throw new Error(`Jupiter quote failed: ${response.status}`);
	}

	const payload = (await response.json()) as { data?: JupiterQuote[] };
	const best = payload.data?.[0];
	if (!best) {
		throw new Error("Jupiter quote returned no routes");
	}

	return {
		route: best,
		bestRoute: buildBestRouteLabel(best),
		feeAmount: sumRouteFees(best),
	};
}

// Fetch the forward and reverse quotes for a given mint pair.
export async function fetchReverseQuote(
	inputMint: string,
	outputMint: string,
	amount: bigint,
	slippageBps = 50
): Promise<{ forward: QuoteDetails; reverse: QuoteDetails }> {
	const forward = await fetchQuote(inputMint, outputMint, amount, slippageBps);
	const reverseAmount = BigInt(forward.route.outAmount);
	const reverse = await fetchQuote(outputMint, inputMint, reverseAmount, slippageBps);

	return { forward, reverse };
}
