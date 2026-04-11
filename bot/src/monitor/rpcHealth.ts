import { connection } from "../config/rpc";
import { emitEvent } from "../server/wsClient";
import { logFailure, logInfo } from "../utils/logger";

let healthTimer: NodeJS.Timeout | null = null;

async function emitHealthTick(): Promise<void> {
	const start = Date.now();
	try {
		const blockHeight = await connection.getBlockHeight();
		const latencyMs = Date.now() - start;
		emitEvent("rpc_health_update", {
			latencyMs,
			blockHeight,
			status: "OK",
		});
	} catch (error) {
		emitEvent("rpc_health_update", {
			latencyMs: Date.now() - start,
			blockHeight: 0,
			status: "FAILED",
		});
		logFailure("RPC health check failed", undefined, (error as Error).message);
		logInfo("RPC connection unstable");
	}
}

export function startRpcMonitor(): void {
	if (healthTimer) return;
	emitHealthTick();
	healthTimer = setInterval(() => {
		void emitHealthTick();
	}, 5000);
}

export function stopRpcMonitor(): void {
	if (!healthTimer) return;
	clearInterval(healthTimer);
	healthTimer = null;
}
