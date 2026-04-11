import { settings } from "../config/settings";
import { buildDualRoute, SwapRoute } from "../dex/routeBuilder";
import { logQuote } from "../utils/logger";
import { emitEvent } from "../server/wsClient";
import { retry, withTimeout } from "../utils/retry";

export type ArbitrageResult = {
	forward: SwapRoute;
	backward: SwapRoute;
	initialAmount: bigint;
	finalAmount: bigint;
	profit: bigint;
	isProfitable: boolean;
	minimumProfitThreshold: bigint;
};

async function fetchQuotesWithRetry(
	inputMint: string,
	outputMint: string,
	amount: bigint
): Promise<{ forward: SwapRoute; backward: SwapRoute; durationMs: number }> {
	const start = Date.now();
	const result = await retry(
		() =>
			withTimeout(
				buildDualRoute(inputMint, outputMint, amount),
				settings.quoteTimeoutMs
				),
		{
			retries: 3,
			delayMs: 500,
			backoffFactor: 2,
			maxDelayMs: 2000,
			jitter: 0.1,
			onRetry: (_error, attempt) => {
				emitEvent("retry_attempt", {
					step: "fetch_quotes",
					attempt,
				});
				emitEvent("log_update", {
					message: `Retrying Fetch Quotes (Attempt ${attempt})`,
					timestamp: new Date().toISOString(),
				});
			},
		}
	);

	return { ...result, durationMs: Date.now() - start };
}

// Fetch forward and reverse quotes for a pair and compute profit.
export async function evaluateArbitrage(
	inputMint: string,
	outputMint: string,
	amount: bigint,
	minimumProfitThreshold = settings.minProfitThreshold
): Promise<ArbitrageResult> {
	emitEvent("execution_update", {
		step: "fetch_quotes",
		status: "running",
		timestamp: new Date().toISOString(),
	});
	emitEvent("log_update", {
		message: "Step start: Fetch Quotes",
		timestamp: new Date().toISOString(),
	});
	let forward: SwapRoute;
	let backward: SwapRoute;
	try {
		const quoteResult = await fetchQuotesWithRetry(
			inputMint,
			outputMint,
			amount
		);
		forward = quoteResult.forward;
		backward = quoteResult.backward;
		emitEvent("step_duration_update", {
			step: "fetch_quotes",
			durationMs: quoteResult.durationMs,
		});
		emitEvent("execution_update", {
			step: "fetch_quotes",
			status: "success",
			timestamp: new Date().toISOString(),
		});
		emitEvent("log_update", {
			message: "Step success: Fetch Quotes",
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		emitEvent("execution_update", {
			step: "fetch_quotes",
			status: "failed",
			timestamp: new Date().toISOString(),
		});
		emitEvent("execution_failed", {
			step: "fetch_quotes",
			error: (error as Error).message,
		});
		emitEvent("log_update", {
			message: `Fetch Quotes failed: ${(error as Error).message}`,
			timestamp: new Date().toISOString(),
		});
		throw error;
	}

	logQuote(
		`forward=${forward.inputMint}:${forward.inAmount}->${forward.outputMint}:${forward.outAmount} ` +
			`backward=${backward.inputMint}:${backward.inAmount}->${backward.outputMint}:${backward.outAmount}`
	);

	const initialAmount = amount;
	const finalAmount = backward.outAmount;
	const detectStart = Date.now();
	const profit = finalAmount - initialAmount;
	const isProfitable = profit > minimumProfitThreshold;

	emitEvent("execution_update", {
		step: "detect_arb",
		status: isProfitable ? "success" : "failed",
		timestamp: new Date().toISOString(),
	});
	emitEvent("step_duration_update", {
		step: "detect_arb",
		durationMs: Date.now() - detectStart,
	});
	emitEvent("log_update", {
		message: `Step ${isProfitable ? "success" : "failed"}: Detect Arbitrage`,
		timestamp: new Date().toISOString(),
	});

	return {
		forward,
		backward,
		initialAmount,
		finalAmount,
		profit,
		isProfitable,
		minimumProfitThreshold,
	};
}
