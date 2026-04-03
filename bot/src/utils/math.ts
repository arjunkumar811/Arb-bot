export function calculateBpsFee(amount: bigint, feeBps: number): bigint {
	return (amount * BigInt(feeBps)) / 10_000n;
}
