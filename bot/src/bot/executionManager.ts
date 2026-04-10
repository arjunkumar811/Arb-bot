import { executeFlashLoanArbitrage } from "../loan/flashLoanExecutor";
import {
	logFlashLoan,
	logFailure,
	logInfo,
	logSuccess,
	logTransaction,
} from "../utils/logger";
import { StrategyDecision } from "./strategyEngine";

export async function executePipeline(decision: StrategyDecision): Promise<void> {
	if (!decision.shouldExecute || !decision.scanResult) {
		throw new Error(decision.reason ?? "No profitable opportunity");
	}

	try {
		const result = await executeFlashLoanArbitrage(decision);
		logFlashLoan(result.repaymentAmount, "Flash loan requested");
		logTransaction(result.signature, "flash-loan-arbitrage");
		logSuccess(
			"Arbitrage pipeline executed",
			result.signature,
			decision.profit.toString()
		);
	} catch (error) {
		logFailure("Arbitrage execution failed", undefined, (error as Error).message);
		throw error;
	}

	logInfo("Pipeline completed");
}
