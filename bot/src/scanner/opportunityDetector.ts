export type OpportunityResult = {
	initialAmount: bigint;
	finalAmount: bigint;
	profit: bigint;
	isProfitable: boolean;
	minimumProfitThreshold: bigint;
};

export function detectOpportunity(
	initialAmount: bigint,
	finalAmount: bigint,
	minimumProfitThreshold: bigint
): OpportunityResult {
	const profit = finalAmount - initialAmount;
	const isProfitable = profit >= minimumProfitThreshold;

	return {
		initialAmount,
		finalAmount,
		profit,
		isProfitable,
		minimumProfitThreshold,
	};
}
