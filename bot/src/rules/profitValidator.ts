export type ProfitValidationInput = {
	initialAmount: bigint;
	finalAmount: bigint;
	flashLoanFee: bigint;
	swapFee: bigint;
	minimumProfitThreshold: bigint;
};

export type ProfitValidationResult = {
	profit: bigint;
	isProfitable: boolean;
	reason?: string;
};

export function validateProfit(
	input: ProfitValidationInput
): ProfitValidationResult {
	const profit = input.finalAmount - input.initialAmount;
	const totalCosts = input.flashLoanFee + input.swapFee;
	const netProfit = profit - totalCosts;
	const isProfitable = netProfit >= input.minimumProfitThreshold;

	return {
		profit: netProfit,
		isProfitable,
		reason: isProfitable ? undefined : "Profit below threshold",
	};
}
