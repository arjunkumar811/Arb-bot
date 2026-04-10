import { TOKENS } from "../config/tokens";
import { settings } from "../config/settings";
import { logFailure, logInfo, logProfit } from "../utils/logger";
import { evaluateArbitrage } from "./arbitrageEngine";
import { executePipeline } from "./executionManager";

type ScanPair = {
	baseMint: string;
	quoteMint: string;
	amount: bigint;
};

let running = false;
let loopPromise: Promise<void> | null = null;

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runLoop(): Promise<void> {
	const pairs: ScanPair[] = [
		{
			baseMint: TOKENS.USDC.mint,
			quoteMint: TOKENS.SOL.mint,
			amount: settings.startAmount,
		},
	];

	while (running) {
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
				await delay(settings.loopDelayMs);
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

// Start the bot loop; returns when stopped.
export function startBot(): Promise<void> {
	if (running) return loopPromise ?? Promise.resolve();
	running = true;
	loopPromise = runLoop();
	return loopPromise;
}

// Stop the bot loop at the next delay boundary.
export function stopBot(): void {
	running = false;
}
