import { settings } from "../config/settings";
import { buildDualRoute, SwapRoute } from "../dex/routeBuilder";
import { logQuote } from "../utils/logger";

export type ArbitrageResult = {
	forward: SwapRoute;
	backward: SwapRoute;
	initialAmount: bigint;
	finalAmount: bigint;
	profit: bigint;
	isProfitable: boolean;
	minimumProfitThreshold: bigint;
};

// Fetch forward and reverse quotes for a pair and compute profit.
export async function evaluateArbitrage(
	inputMint: string,
	outputMint: string,
	amount: bigint,
	minimumProfitThreshold = settings.minProfitThreshold
): Promise<ArbitrageResult> {
	const { forward, backward } = await buildDualRoute(
		inputMint,
		outputMint,
		amount
	);

	logQuote(
		`forward=${forward.inputMint}:${forward.inAmount}->${forward.outputMint}:${forward.outAmount} ` +
			`backward=${backward.inputMint}:${backward.inAmount}->${backward.outputMint}:${backward.outAmount}`
	);

	const initialAmount = amount;
	const finalAmount = backward.outAmount;
	const profit = finalAmount - initialAmount;
	const isProfitable = profit > minimumProfitThreshold;

	return {
		forward,
		backward,
		initialAmount,
		finalAmount,
		profit,
		isProfitable,
		minimumProfitThreshold,
	};
}
