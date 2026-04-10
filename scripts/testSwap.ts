import { TOKENS } from "../bot/src/config/tokens";
import { settings } from "../bot/src/config/settings";
import { getQuote } from "../bot/src/scanner/priceScanner";
import { executeSwap } from "../bot/src/executor/swapExecutor";

async function testSwap(): Promise<void> {
	const inputMint = TOKENS.USDC.mint;
	const outputMint = TOKENS.SOL.mint;
	const amount = settings.startAmount;

	const quote = await getQuote(inputMint, outputMint, amount);
	const result = await executeSwap(quote.route);

	console.log("Swap success:", result.success, result.signature);
}

testSwap().catch((error) => {
	console.error("Swap test failed:", error);
	process.exit(1);
});
