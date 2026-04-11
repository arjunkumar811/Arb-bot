import { fetch, ProxyAgent, setGlobalDispatcher } from "undici";
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

const JUPITER_QUOTE_URL =
	process.env.JUPITER_QUOTE_URL ?? "https://quote-api.jup.ag/v6/quote";
const JUPITER_SWAP_URL =
	process.env.JUPITER_SWAP_URL ?? "https://quote-api.jup.ag/v6/swap";

const proxyUrl = process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY;
if (proxyUrl) {
	setGlobalDispatcher(new ProxyAgent(proxyUrl));
}

const mockOnFailure =
	process.env.MOCK_QUOTES_ON_FAILURE?.toLowerCase() !== "false";

function debugLog(message: string): void {
	console.log(message);
	logInfo(message);
}

function isNetworkResolutionError(message: string): boolean {
	return (
		message.includes("ENOTFOUND") ||
		message.toLowerCase().includes("getaddrinfo") ||
		message.toLowerCase().includes("could not be resolved") ||
		message.toLowerCase().includes("fetch failed")
	);
}

function buildMockQuote(
	inputMint: string,
	outputMint: string,
	amount: bigint
): JupiterQuote {
	const outAmount = amount - amount / 200n; // -0.5% to avoid false profits
	return {
		inputMint,
		outputMint,
		inAmount: amount.toString(),
		outAmount: outAmount.toString(),
		otherAmountThreshold: (outAmount - outAmount / 100n).toString(),
		swapMode: "mock",
		slippageBps: settings.slippageBps,
		priceImpactPct: "0.005",
	};
}

function validateQuoteInputs(
	inputMint: string,
	outputMint: string,
	amount: bigint,
	slippageBps: number
): void {
	console.log({ inputMint, outputMint, amount: amount.toString(), slippageBps });
	if (!inputMint || !outputMint) {
		throw new Error("Invalid mint: inputMint/outputMint required");
	}
	if (amount <= 0n) {
		throw new Error("Invalid amount: must be greater than zero");
	}
}

export async function testJupiterConnection(): Promise<void> {
	const url =
		"https://quote-api.jup.ag/v6/quote" +
		"?inputMint=So11111111111111111111111111111111111111112" +
		"&outputMint=EPjFWdd5AufqSSqeM2q8kP9Rwx8wZMBZ9K9J8sWq5uV" +
		"&amount=1000000&slippageBps=50";

	debugLog(`Jupiter test URL: ${url}`);
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 10000);
	try {
		const response = await fetch(url, { signal: controller.signal });
		debugLog(`Jupiter test status: ${response.status} ${response.statusText}`);
	} catch (error) {
		console.error("Jupiter connection failed:", error);
		logFailure(
			"Jupiter connection failed",
			undefined,
			(error as Error).message
		);
	} finally {
		clearTimeout(timer);
	}
}

export async function fetchQuote(
	inputMint: string,
	outputMint: string,
	amount: bigint,
	slippageBps = settings.slippageBps,
	timeoutMs = settings.quoteTimeoutMs
): Promise<JupiterQuote> {
	validateQuoteInputs(inputMint, outputMint, amount, slippageBps);
	const params = new URLSearchParams({
		inputMint,
		outputMint,
		amount: amount.toString(),
		slippageBps: slippageBps.toString(),
	});

	const url = `${JUPITER_QUOTE_URL}?${params.toString()}`;
	debugLog(`Fetching Jupiter Quote URL: ${url}`);

	const requestQuote = async (): Promise<JupiterQuote> => {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), timeoutMs);
		try {
			const response = await fetch(url, {
				signal: controller.signal,
				headers: {
					accept: "application/json",
					"user-agent": "arb-bot/1.0",
				},
			});
			debugLog(
				`Jupiter response status: ${response.status} ${response.statusText}`
			);
			if (!response.ok) {
				const body = await response.text();
				console.error("Jupiter bad response:", body.slice(0, 400));
				throw new Error(
					`Jupiter quote failed: ${response.status} ${response.statusText} ${body.slice(
						0,
						200
					)}`
				);
			}
			const payload = (await response.json()) as JupiterQuoteResponse;
			const best = payload.data?.[0];
			if (!best) {
				throw new Error("Jupiter quote returned no routes");
			}
			debugLog("Quote received successfully");
			return best;
		} catch (error) {
			if (controller.signal.aborted) {
				debugLog("Fetch timeout occurred");
				throw new Error("Jupiter quote timed out");
			}
			console.error("Fetch Quotes Error:", error);
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
		const err = error as Error & { cause?: unknown };
		const causeMessage = err.cause instanceof Error ? err.cause.message : "";
		const message = err.stack ?? err.message;
		logFailure(
			"Jupiter quote failed",
			undefined,
			causeMessage ? `${message} | Cause: ${causeMessage}` : message
		);
		if (mockOnFailure) {
			if (!isNetworkResolutionError(message)) {
				logInfo("Using mock quote fallback (Jupiter unavailable)");
			} else {
				logInfo("Using mock quote fallback (network unreachable)");
			}
			return buildMockQuote(inputMint, outputMint, amount);
		}
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
			headers: {
				"Content-Type": "application/json",
				accept: "application/json",
				"user-agent": "arb-bot/1.0",
			},
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
