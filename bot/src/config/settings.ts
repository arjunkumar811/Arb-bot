import { readRuntimeSettings } from "./runtime";

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
	flashLoanFeeBps: number;
	swapFeeBps: number;
	arbitrageProgramId: string;
	inputTokenAccount: string;
	outputTokenAccount: string;
	tokenProgramId: string;
	flashLoanProgramId: string;
	flashLoanReserveAccount: string;
	flashLoanLiquidityAccount: string;
	flashLoanFeeReceiverAccount: string;
	flashLoanHostFeeReceiverAccount: string;
	flashLoanLendingMarketAccount: string;
	flashLoanOwnerAccount: string;
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

export function getSettings(): Settings {
	const runtime = readRuntimeSettings();
	return {
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
		flashLoanFeeBps: readNumber(process.env.FLASH_LOAN_FEE_BPS, 30),
		swapFeeBps: readNumber(process.env.SWAP_FEE_BPS, 30),
		arbitrageProgramId: process.env.ARB_PROGRAM_ID ?? "",
		inputTokenAccount:
			runtime.inputTokenAccount ?? process.env.INPUT_TOKEN_ACCOUNT ?? "",
		outputTokenAccount:
			runtime.outputTokenAccount ?? process.env.OUTPUT_TOKEN_ACCOUNT ?? "",
		tokenProgramId:
			process.env.TOKEN_PROGRAM_ID ??
			"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
		flashLoanProgramId: process.env.FLASH_LOAN_PROGRAM_ID ?? "",
		flashLoanReserveAccount: process.env.FLASH_LOAN_RESERVE ?? "",
		flashLoanLiquidityAccount: process.env.FLASH_LOAN_LIQUIDITY ?? "",
		flashLoanFeeReceiverAccount: process.env.FLASH_LOAN_FEE_RECEIVER ?? "",
		flashLoanHostFeeReceiverAccount:
			process.env.FLASH_LOAN_HOST_FEE_RECEIVER ??
			process.env.FLASH_LOAN_FEE_RECEIVER ??
			"",
		flashLoanLendingMarketAccount:
			process.env.FLASH_LOAN_MARKET ??
			process.env.FLASH_LOAN_OWNER ??
			"",
		flashLoanOwnerAccount: process.env.FLASH_LOAN_OWNER ?? "",
	};
}

export const settings: Settings = getSettings();
