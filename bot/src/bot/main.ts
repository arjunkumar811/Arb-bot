import { TOKENS } from "../config/tokens";
import { settings } from "../config/settings";
import { logFailure, logInfo, logProfit } from "../utils/logger";
import { evaluateArbitrage } from "./arbitrageEngine";
import { executePipeline } from "./executionManager";

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runBot(): Promise<void> {
	const pairs = [
		{ baseMint: TOKENS.USDC.mint, quoteMint: TOKENS.SOL.mint, amount: settings.startAmount },
	];

	while (true) {
		try {
			logInfo("Scanning for opportunities");
			const results = await Promise.all(
				pairs.map((pair) =>
					evaluateArbitrage(pair.baseMint, pair.quoteMint, pair.amount)
				)
			);

			const best = results
				.filter((result) => result.isProfitable)
				.sort((a, b) => Number(b.profit - a.profit))[0];

			if (!best) {
				logInfo("No profitable opportunity");
				continue;
			}

			logProfit(best.profit, "Arbitrage opportunity detected");
			await executePipeline({
				shouldExecute: true,
				reason: undefined,
				profit: best.profit,
				flashLoanFee: 0n,
				swapFee: 0n,
				scanResult: {
					forward: best.forward,
					backward: best.backward,
					initialAmount: best.initialAmount,
					finalAmount: best.finalAmount,
				},
			});
		} catch (error) {
			logFailure("Loop error", undefined, (error as Error).message);
		}

		await delay(settings.loopDelayMs);
	}
}
