import { settings } from "../config/settings";
import { calculateBpsFee } from "../utils/math";
import { validateProfit } from "../rules/profitValidator";
import { ScanResult } from "./scanner";

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
