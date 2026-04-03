import { TOKENS } from "./config/tokens";
import { getQuote } from "./scanner/priceScanner";
import { detectOpportunity } from "./scanner/opportunityDetector";
import { executeSwap } from "./executor/swapExecutor";

const LOOP_DELAY_MS = Number(process.env.LOOP_DELAY_MS ?? 5000);
const MIN_PROFIT_THRESHOLD = BigInt(process.env.MIN_PROFIT_THRESHOLD ?? "0");
const START_AMOUNT = BigInt(process.env.START_AMOUNT ?? "1000000");

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run(): Promise<void> {
	while (true) {
		try {
			const firstQuote = await getQuote(
				TOKENS.USDC.mint,
				TOKENS.SOL.mint,
				START_AMOUNT
			);

			const secondQuote = await getQuote(
				TOKENS.SOL.mint,
				TOKENS.USDC.mint,
				firstQuote.outAmount
			);

			const opportunity = detectOpportunity(
				START_AMOUNT,
				secondQuote.outAmount,
				MIN_PROFIT_THRESHOLD
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

		await delay(LOOP_DELAY_MS);
	}
}

run().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
