import { getSettings } from "../config/settings";
import { calculateBpsFee } from "../utils/math";
import { validateProfit } from "../rules/profitValidator";
import { ScanResult } from "./scanner";
import { emitEvent } from "../server/wsClient";

export type StrategyDecision = {
	shouldExecute: boolean;
	reason?: string;
	profit: bigint;
	flashLoanFee: bigint;
	swapFee: bigint;
	scanResult: ScanResult | null;
};

export function evaluateOpportunities(
	results: ScanResult[]
): StrategyDecision {
	const settings = getSettings();
	let best: StrategyDecision = {
		shouldExecute: false,
		reason: "No opportunities",
		profit: 0n,
		flashLoanFee: 0n,
		swapFee: 0n,
		scanResult: null,
	};

	for (const result of results) {
		const flashLoanFee = calculateBpsFee(
			result.initialAmount,
			settings.flashLoanFeeBps
		);
		const swapFee =
			calculateBpsFee(result.initialAmount, settings.swapFeeBps) +
			calculateBpsFee(result.forward.outAmount, settings.swapFeeBps);

		const validation = validateProfit({
			initialAmount: result.initialAmount,
			finalAmount: result.finalAmount,
			flashLoanFee,
			swapFee,
			minimumProfitThreshold: settings.minProfitThreshold,
		});

		const startAmount = result.initialAmount;
		const finalAmount = result.finalAmount;
		const profit = validation.profit;
		const percentage =
			startAmount > 0n
				? (Number(profit) / Number(startAmount)) * 100
				: 0;

		emitEvent("arb_update", {
			startAmount: startAmount.toString(),
			finalAmount: finalAmount.toString(),
			profit: profit.toString(),
			percentage,
			profitable: validation.isProfitable,
		});

		if (validation.isProfitable && validation.profit > best.profit) {
			best = {
				shouldExecute: true,
				reason: undefined,
				profit: validation.profit,
				flashLoanFee,
				swapFee,
				scanResult: result,
			};
		}
	}

	return best;
}
