import { settings } from "../config/settings";
import { logFailure, logInfo } from "../utils/logger";
import { retry, withTimeout } from "../utils/retry";

export type JupiterQuote = {
	inputMint: string;
	outputMint: string;
	inAmount: string;
	outAmount: string;
	otherAmountThreshold: string;
	swapMode: string;
	slippageBps: number;
	priceImpactPct: string;
};

export type JupiterQuoteResponse = {
	data: JupiterQuote[];
};

const JUPITER_QUOTE_URL = "https://quote-api.jup.ag/v6/quote";
const JUPITER_SWAP_URL = "https://quote-api.jup.ag/v6/swap";

export async function fetchQuote(
	inputMint: string,
	outputMint: string,
	amount: bigint,
	slippageBps = settings.slippageBps,
	timeoutMs = settings.quoteTimeoutMs
): Promise<JupiterQuote> {
	const params = new URLSearchParams({
		inputMint,
		outputMint,
		amount: amount.toString(),
		slippageBps: slippageBps.toString(),
	});

	const requestQuote = async (): Promise<JupiterQuote> => {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), timeoutMs);
		try {
			const response = await fetch(`${JUPITER_QUOTE_URL}?${params.toString()}`, {
				signal: controller.signal,
			});
			if (!response.ok) {
				throw new Error(
					`Jupiter quote failed: ${response.status} ${response.statusText}`
				);
			}
			const payload = (await response.json()) as JupiterQuoteResponse;
			const best = payload.data?.[0];
			if (!best) {
				throw new Error("Jupiter quote returned no routes");
			}
			return best;
		} catch (error) {
			if (controller.signal.aborted) {
				throw new Error("Jupiter quote timed out");
			}
			throw error;
		} finally {
			clearTimeout(timer);
		}
	};

	try {
		return await retry(requestQuote, {
			retries: Math.max(0, settings.swapRetries - 1),
			delayMs: 300,
			backoffFactor: 2,
			maxDelayMs: 2500,
			jitter: 0.2,
			onRetry: (error, attempt) => {
				logInfo(`Jupiter quote retry ${attempt}: ${error.message}`);
			},
		});
	} catch (error) {
		logFailure("Jupiter quote failed", undefined, (error as Error).message);
		throw error;
	}
}

export async function buildSwapTransaction(
	quoteResponse: JupiterQuote,
	userPublicKey: string,
	options?: {
		wrapAndUnwrapSol?: boolean;
		prioritizationFeeLamports?: number;
		computeUnitLimit?: number;
	}
): Promise<{ swapTransaction: string; lastValidBlockHeight: number }> {
	const requestSwap = async (): Promise<{
		swapTransaction: string;
		lastValidBlockHeight: number;
	}> => {
		const response = await fetch(JUPITER_SWAP_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				quoteResponse,
				userPublicKey,
				wrapAndUnwrapSol: options?.wrapAndUnwrapSol ?? true,
				prioritizationFeeLamports: options?.prioritizationFeeLamports,
				computeUnitLimit: options?.computeUnitLimit,
			}),
		});

		if (!response.ok) {
			const text = await response.text();
			if (text.toLowerCase().includes("slippage")) {
				throw new Error("Swap failed due to slippage");
			}
			throw new Error(`Jupiter swap failed: ${response.status} ${text}`);
		}

		return (await response.json()) as {
			swapTransaction: string;
			lastValidBlockHeight: number;
		};
	};

	try {
		return await withTimeout(
			retry(requestSwap, {
				retries: Math.max(0, settings.swapRetries - 1),
				delayMs: 300,
				backoffFactor: 2,
				maxDelayMs: 2500,
				jitter: 0.2,
				onRetry: (error, attempt) => {
					logInfo(`Jupiter swap retry ${attempt}: ${error.message}`);
				},
				shouldRetry: (error) =>
					!error.message.toLowerCase().includes("slippage"),
			}),
			settings.swapTimeoutMs
		);
	} catch (error) {
		logFailure("Jupiter swap build failed", undefined, (error as Error).message);
		throw error;
	}
}
