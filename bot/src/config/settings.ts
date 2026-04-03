type Settings = {
	loopDelayMs: number;
	minProfitThreshold: bigint;
	startAmount: bigint;
	slippageBps: number;
	swapRetries: number;
	swapTimeoutMs: number;
	quoteTimeoutMs: number;
	confirmTimeoutMs: number;
	priorityFeeMicroLamports: number;
	computeUnitLimit: number;
};

function readNumber(value: string | undefined, fallback: number): number {
	if (!value) return fallback;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function readBigInt(value: string | undefined, fallback: bigint): bigint {
	if (!value) return fallback;
	try {
		return BigInt(value);
	} catch {
		return fallback;
	}
}

export const settings: Settings = {
	loopDelayMs: readNumber(process.env.LOOP_DELAY_MS, 5000),
	minProfitThreshold: readBigInt(process.env.MIN_PROFIT_THRESHOLD, 0n),
	startAmount: readBigInt(process.env.START_AMOUNT, 1000000n),
	slippageBps: readNumber(process.env.SLIPPAGE_BPS, 50),
	swapRetries: readNumber(process.env.SWAP_RETRIES, 3),
	swapTimeoutMs: readNumber(process.env.SWAP_TIMEOUT_MS, 20000),
	quoteTimeoutMs: readNumber(process.env.QUOTE_TIMEOUT_MS, 10000),
	confirmTimeoutMs: readNumber(process.env.CONFIRM_TIMEOUT_MS, 30000),
	priorityFeeMicroLamports: readNumber(
		process.env.PRIORITY_FEE_MICROLAMPORTS,
		0
	),
	computeUnitLimit: readNumber(process.env.COMPUTE_UNIT_LIMIT, 0),
};
