import { executeFlashLoanArbitrage } from "../loan/flashLoanExecutor";
import {
	logFlashLoan,
	logFailure,
	logInfo,
	logSuccess,
	logTransaction,
} from "../utils/logger";
import { StrategyDecision } from "./strategyEngine";
import { emitEvent } from "../server/wsClient";

export async function executePipeline(decision: StrategyDecision): Promise<void> {
	if (!decision.shouldExecute || !decision.scanResult) {
		throw new Error(decision.reason ?? "No profitable opportunity");
	}

	const expectedProfit =
		decision.scanResult.finalAmount - decision.scanResult.initialAmount;
	const fees = decision.flashLoanFee + decision.swapFee;
	const netProfit = expectedProfit - fees;

	if (expectedProfit <= fees) {
		emitEvent("profit_validation_failed", {
			expectedProfit: expectedProfit.toString(),
			fees: fees.toString(),
			netProfit: netProfit.toString(),
		});
		logFailure("Profit validation failed", undefined, "Fees exceed profit");
		return;
	}

	const executionStart = Date.now();

	try {
		const result = await executeFlashLoanArbitrage(decision);
		logFlashLoan(result.repaymentAmount, "Flash loan requested");
		logTransaction(result.signature, "flash-loan-arbitrage");
		logSuccess(
			"Arbitrage pipeline executed",
			result.signature,
			decision.profit.toString()
		);
		emitEvent("profit_update", {
			expectedProfit: expectedProfit.toString(),
			actualProfit: decision.profit.toString(),
			fees: fees.toString(),
			netProfit: netProfit.toString(),
		});
		updateProfitStats(netProfit, true);
	} catch (error) {
		logFailure("Arbitrage execution failed", undefined, (error as Error).message);
		updateProfitStats(netProfit, false);
		throw error;
	} finally {
		emitEvent("execution_latency_update", {
			totalExecutionTime: Date.now() - executionStart,
		});
	}

	logInfo("Pipeline completed");
}

type ProfitPoint = { time: string; profit: number };
type ProfitStats = {
	totalTrades: number;
	successCount: number;
	failCount: number;
	totalProfit: number;
	dailyProfit: number;
	history: ProfitPoint[];
};

const profitStats: ProfitStats = {
	totalTrades: 0,
	successCount: 0,
	failCount: 0,
	totalProfit: 0,
	dailyProfit: 0,
	history: [],
};

function updateProfitStats(netProfit: bigint, success: boolean): void {
	const profitNumber = Number(netProfit);
	if (!Number.isFinite(profitNumber)) return;

	profitStats.totalTrades += 1;
	profitStats.totalProfit += profitNumber;
	if (success) {
		profitStats.successCount += 1;
	} else {
		profitStats.failCount += 1;
	}

	profitStats.history.push({
		time: new Date().toISOString(),
		profit: profitNumber,
	});
	profitStats.history = profitStats.history.slice(-50);

	const today = new Date().toISOString().slice(0, 10);
	profitStats.dailyProfit = profitStats.history
		.filter((point) => point.time.startsWith(today))
		.reduce((acc, point) => acc + point.profit, 0);

	emitEvent("profit_stats_update", {
		totalTrades: profitStats.totalTrades,
		successCount: profitStats.successCount,
		failCount: profitStats.failCount,
		totalProfit: profitStats.totalProfit,
		dailyProfit: profitStats.dailyProfit,
		history: profitStats.history,
	});
}
