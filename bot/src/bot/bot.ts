import { TOKENS } from "../config/tokens";
import { getSettings } from "../config/settings";
import { logFailure, logInfo, logProfit } from "../utils/logger";
import { evaluateArbitrage } from "./arbitrageEngine";
import { executePipeline } from "./executionManager";
import { emitWalletUpdate } from "../wallet/walletTracker";
import { emitEvent } from "../server/wsClient";
import { startRpcMonitor, stopRpcMonitor } from "../monitor/rpcHealth";

type ScanPair = {
	baseMint: string;
	quoteMint: string;
	amount: bigint;
};

let running = false;
let loopPromise: Promise<void> | null = null;
let executionQueue: number = 0;
let executing = false;
let stopRequested = false;
let delayTimer: NodeJS.Timeout | null = null;
let delayResolve: (() => void) | null = null;

function emitExecutionState(): void {
	emitEvent("execution_state", { executing });
}

function emitQueueUpdate(): void {
	emitEvent("execution_queue_update", { queueSize: executionQueue });
}

function interruptibleDelay(ms: number): Promise<void> {
	if (!ms || ms <= 0) return Promise.resolve();
	return new Promise((resolve) => {
		delayResolve = () => {
			delayResolve = null;
			delayTimer = null;
			resolve();
		};
		delayTimer = setTimeout(() => {
			delayResolve?.();
		}, ms);
	});
}

function cancelDelay(): void {
	if (!delayTimer) return;
	clearTimeout(delayTimer);
	delayTimer = null;
	delayResolve?.();
}

async function runCycle(): Promise<void> {
	const settings = getSettings();
	const demoQuotesOnly =
		process.env.DEMO_QUOTES_ONLY?.toLowerCase() === "true";
	const useMockQuotes =
		process.env.USE_MOCK_QUOTES?.toLowerCase() === "true";
	logInfo("Starting arbitrage scan...");
	logInfo(`RPC: ${process.env.RPC_URL ?? ""}`);
	logInfo(`Using mock mode: ${useMockQuotes}`);
	const pairs: ScanPair[] = [
		{
			baseMint: TOKENS.USDC.mint,
			quoteMint: TOKENS.SOL.mint,
			amount: settings.startAmount,
		},
	];

	await emitWalletUpdate();
	logInfo("Scanning for opportunities");
	const results = await Promise.all(
		pairs.map((pair) =>
			evaluateArbitrage(pair.baseMint, pair.quoteMint, pair.amount)
		)
	);

	const best = results
		.filter((result) => result.isProfitable)
		.sort((a, b) => Number(b.profit - a.profit))[0];

	if (!best) {
		logInfo("No profitable opportunity");
		return;
	}

	if (demoQuotesOnly) {
		logInfo("Demo mode: quotes only, execution skipped");
		return;
	}

	logProfit(best.profit, "Arbitrage opportunity detected");
	await executePipeline({
		shouldExecute: true,
		reason: undefined,
		profit: best.profit,
		flashLoanFee: 0n,
		swapFee: 0n,
		scanResult: {
			forward: best.forward,
			backward: best.backward,
			initialAmount: best.initialAmount,
			finalAmount: best.finalAmount,
		},
	});
}

async function runLoop(): Promise<void> {
	while (running) {
		let processedQueue = false;
		try {
			executing = true;
			emitExecutionState();
			await runCycle();
			while (executionQueue > 0) {
				executionQueue -= 1;
				emitQueueUpdate();
				processedQueue = true;
				await runCycle();
			}
		} catch (error) {
			const err = error as Error;
			console.error("=== LOOP ERROR ===");
			console.error("Message:", err?.message);
			console.error("Stack:", err?.stack);
			logInfo(`Loop error: ${err?.message ?? String(error)}`);
		} finally {
			executing = false;
			emitExecutionState();
		}

		if (processedQueue) {
			continue;
		}

		const settings = getSettings();
		await interruptibleDelay(settings.loopDelayMs);
	}

	if (stopRequested) {
		logInfo("Bot Stopped Safely");
		emitEvent("log_update", {
			message: "Bot Stopped Safely",
			timestamp: new Date().toISOString(),
		});
		stopRequested = false;
	}
}

// Start the bot loop; returns when stopped.
export function startBot(): Promise<void> {
	if (running) return loopPromise ?? Promise.resolve();
	running = true;
	stopRequested = false;
	startRpcMonitor();
	loopPromise = runLoop();
	return loopPromise;
}

// Stop the bot loop at the next delay boundary.
export function stopBot(): void {
	stopRequested = true;
	running = false;
	cancelDelay();
	stopRpcMonitor();
}

export function isBotRunning(): boolean {
	return running;
}

async function runQueuedExecutions(): Promise<void> {
	if (executing) return;
	executing = true;
	emitExecutionState();
	try {
		while (executionQueue > 0) {
			executionQueue -= 1;
			emitQueueUpdate();
			await runCycle();
		}
	} catch (error) {
		logFailure("Queued execution error", undefined, (error as Error).message);
	} finally {
		executing = false;
		emitExecutionState();
	}
}

export async function runSingleExecution(): Promise<void> {
	executionQueue += 1;
	emitQueueUpdate();
	cancelDelay();
	await runQueuedExecutions();
}
