import http from "http";
import { Server, Socket } from "socket.io";
import {
	isBotRunning,
	runSingleExecution,
	startBot,
	stopBot,
} from "../bot/src/bot/bot";

export type BotEventPayload = Record<string, unknown>;
type ProfitPoint = { time: string; profit: number };
type ProfitStats = {
	totalTrades: number;
	successfulTrades: number;
	failedTrades: number;
	totalProfit: number;
	history: ProfitPoint[];
};

const PORT = Number(process.env.WS_PORT ?? 3002);

const httpServer = http.createServer();
const io = new Server(httpServer, {
	cors: {
		origin: "*",
	},
});

const profitStats: ProfitStats = {
	totalTrades: 0,
	successfulTrades: 0,
	failedTrades: 0,
	totalProfit: 0,
	history: [],
};

let simulationEnabled = false;
let simulationTimer: NodeJS.Timeout | null = null;

function updateProfitStats(payload: BotEventPayload): void {
	const profitRaw = payload.profit as string | number | undefined;
	const profitableRaw = payload.profitable as boolean | undefined;
	const profit = typeof profitRaw === "string" ? Number(profitRaw) : profitRaw ?? 0;
	const isProfitable = profitableRaw ?? profit > 0;

	if (!Number.isFinite(profit)) return;

	profitStats.totalTrades += 1;
	profitStats.totalProfit += profit;
	if (isProfitable) {
		profitStats.successfulTrades += 1;
	} else {
		profitStats.failedTrades += 1;
	}

	profitStats.history.push({
		time: new Date().toISOString(),
		profit,
	});
	profitStats.history = profitStats.history.slice(-50);
}

function emitMockTick(): void {
	const profit = Math.floor(Math.random() * 20000) - 5000;
	const arbPayload = {
		startAmount: "1000000",
		finalAmount: (1000000 + profit).toString(),
		profit: profit.toString(),
		percentage: (profit / 1000000) * 100,
		profitable: profit > 0,
	};

	io.emit("wallet_update", {
		solBalance: Math.random() * 5,
		usdcBalance: Math.floor(Math.random() * 2000).toString(),
		usdtBalance: Math.floor(Math.random() * 1800).toString(),
	});

	io.emit("quote_update", {
		inputToken: "SOL",
		outputToken: "USDC",
		inputAmount: "1000000",
		outputAmount: Math.floor(Math.random() * 1000000).toString(),
		route: "raydium-orca",
		fee: "50",
	});

	io.emit("arb_update", arbPayload);
	updateProfitStats(arbPayload);
	io.emit("profit_stats_update", profitStats);

	io.emit("execution_update", {
		step: "confirmed",
		transactionSignature: "SIMULATED",
	});

	io.emit("log_update", {
		message: "Simulation tick",
		timestamp: new Date().toISOString(),
	});
}

function setSimulationEnabled(enabled: boolean): void {
	simulationEnabled = enabled;
	io.emit("simulation_update", { enabled: simulationEnabled });

	if (simulationEnabled && !simulationTimer) {
		simulationTimer = setInterval(emitMockTick, 2000);
	}

	if (!simulationEnabled && simulationTimer) {
		clearInterval(simulationTimer);
		simulationTimer = null;
	}
}

function emitControlLog(message: string): void {
	io.emit("log_update", {
		message,
		timestamp: new Date().toISOString(),
	});
}

io.on("connection", (socket: Socket) => {
	socket.emit("log_update", {
		message: "WebSocket connected",
		timestamp: new Date().toISOString(),
	});

	socket.emit("profit_stats_update", profitStats);
	socket.emit("simulation_update", { enabled: simulationEnabled });

	socket.onAny((event: string, payload: unknown) => {
		io.emit(event, payload);
		if (event === "arb_update") {
			updateProfitStats(payload as BotEventPayload);
			io.emit("profit_stats_update", profitStats);
		}
	});

	socket.on("simulation_toggle", (payload: { enabled?: boolean }) => {
		setSimulationEnabled(Boolean(payload?.enabled));
	});

	socket.on("start_bot", async () => {
		if (!isBotRunning()) {
			emitControlLog("Bot Started");
			try {
				await startBot();
			} catch (error) {
				emitControlLog(`Bot start failed: ${(error as Error).message}`);
			}
		}
	});

	socket.on("execute_single", async () => {
		emitControlLog("Single Execution Triggered");
		await runSingleExecution();
	});

	socket.on("stop_bot", () => {
		stopBot();
		emitControlLog("Bot Stopped");
	});

	socket.on("disconnect", () => {
		// no-op
	});
});

export function emitEvent(event: string, payload: BotEventPayload): void {
	io.emit(event, payload);
}

httpServer.listen(PORT, () => {
	console.log(`WS server listening on :${PORT}`);
});
