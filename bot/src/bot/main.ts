import { TOKENS } from "../config/tokens";
import { settings } from "../config/settings";
import { logFailure, logInfo, logProfit } from "../utils/logger";
import { scanPairs } from "./scanner";
import { evaluateOpportunities } from "./strategyEngine";
import { executePipeline } from "./executionManager";

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runBot(): Promise<void> {
	const pairs = [
		{ baseMint: TOKENS.USDC.mint, quoteMint: TOKENS.SOL.mint, amount: settings.startAmount },
		{ baseMint: TOKENS.USDT.mint, quoteMint: TOKENS.SOL.mint, amount: settings.startAmount },
	];

	while (true) {
		try {
			logInfo("Scanning for opportunities");
			const results = await scanPairs(pairs);
			const decision = evaluateOpportunities(results);

			if (!decision.shouldExecute) {
				logInfo(decision.reason ?? "No profitable opportunity");
			} else {
				logProfit(decision.profit, "Opportunity accepted");
				await executePipeline(decision);
			}
		} catch (error) {
			logFailure("Loop error", undefined, (error as Error).message);
		}

		await delay(settings.loopDelayMs);
	}
}
