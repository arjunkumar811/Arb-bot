import { TOKENS } from "./config/tokens";
import { settings } from "./config/settings";
import { getQuote } from "./scanner/priceScanner";
import { detectOpportunity } from "./scanner/opportunityDetector";
import { executeSwap } from "./executor/swapExecutor";

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run(): Promise<void> {
	while (true) {
		try {
			const firstQuote = await getQuote(
				TOKENS.USDC.mint,
				TOKENS.SOL.mint,
				settings.startAmount
			);

			const secondQuote = await getQuote(
				TOKENS.SOL.mint,
				TOKENS.USDC.mint,
				firstQuote.outAmount
			);

			const opportunity = detectOpportunity(
				settings.startAmount,
				secondQuote.outAmount,
				settings.minProfitThreshold
			);

			if (opportunity.isProfitable) {
				console.log(
					`Opportunity found. Profit: ${opportunity.profit.toString()}`
				);
				await executeSwap(firstQuote.route);
				await executeSwap(secondQuote.route);
			} else {
				console.log("No profitable opportunity.");
			}
		} catch (error) {
			console.error("Loop error:", error);
		}

			await delay(settings.loopDelayMs);
	}
}

run().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
