import { settings } from "../bot/src/config/settings";
import { TOKENS } from "../bot/src/config/tokens";
import { buildDualRoute } from "../bot/src/dex/routeBuilder";
import { executeDexSwap } from "../bot/src/dex/dexExecutor";
import { validateProfit } from "../bot/src/rules/profitValidator";
import { calculateBpsFee } from "../bot/src/utils/math";
import { executePipeline } from "../bot/src/bot/executionManager";

function requireSetting(value: string, label: string): string {
	if (!value) {
		throw new Error(`${label} is not configured`);
	}
	return value;
}

async function testArbitrage(): Promise<void> {
	const amount = settings.startAmount;
	const { forward, backward } = await buildDualRoute(
		TOKENS.USDC.mint,
		TOKENS.SOL.mint,
		amount
	);

	console.log("Route forward:", {
		inputMint: forward.inputMint,
		outputMint: forward.outputMint,
		inAmount: forward.inAmount.toString(),
		outAmount: forward.outAmount.toString(),
	});
	console.log("Route backward:", {
		inputMint: backward.inputMint,
		outputMint: backward.outputMint,
		inAmount: backward.inAmount.toString(),
		outAmount: backward.outAmount.toString(),
	});

	const flashLoanFee = calculateBpsFee(amount, settings.flashLoanFeeBps);
	const swapFee =
		calculateBpsFee(amount, settings.swapFeeBps) +
		calculateBpsFee(forward.outAmount, settings.swapFeeBps);

	const validation = validateProfit({
		initialAmount: amount,
		finalAmount: backward.outAmount,
		flashLoanFee,
		swapFee,
		minimumProfitThreshold: settings.minProfitThreshold,
	});

	console.log("Profit:", validation.profit.toString());

	if (!validation.isProfitable) {
		console.log("No profitable opportunity.");
		return;
	}

	const forwardResult = await executeDexSwap(forward.quote);
	console.log("Swap forward signature:", forwardResult.signature);

	const backwardResult = await executeDexSwap(backward.quote);
	console.log("Swap backward signature:", backwardResult.signature);

	requireSetting(settings.arbitrageProgramId, "ARB_PROGRAM_ID");
	requireSetting(settings.inputTokenAccount, "INPUT_TOKEN_ACCOUNT");
	requireSetting(settings.outputTokenAccount, "OUTPUT_TOKEN_ACCOUNT");
	requireSetting(settings.flashLoanProgramId, "FLASH_LOAN_PROGRAM_ID");
	requireSetting(settings.flashLoanReserveAccount, "FLASH_LOAN_RESERVE");
	requireSetting(settings.flashLoanLiquidityAccount, "FLASH_LOAN_LIQUIDITY");
	requireSetting(settings.flashLoanOwnerAccount, "FLASH_LOAN_OWNER");

	await executePipeline({
		shouldExecute: true,
		reason: undefined,
		profit: validation.profit,
		flashLoanFee,
		swapFee,
		scanResult: {
			forward,
			backward,
			initialAmount: amount,
			finalAmount: backward.outAmount,
		},
	});

	console.log("Arbitrage pipeline executed");
}

testArbitrage().catch((error) => {
	console.error("Arbitrage test failed:", error);
	process.exit(1);
});
