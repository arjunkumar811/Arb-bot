import cors from "cors";
import express from "express";
import fs from "fs";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { writeRuntimeSettings } from "./config/runtime";

const PORT = Number(process.env.API_PORT ?? 3001);
const LOG_FILE =
	process.env.LOG_FILE ?? path.resolve(process.cwd(), "logs", "arb-bot.log");
const ENV_PATH = path.resolve(process.cwd(), ".env");

type BotStatus = {
	status: "running" | "stopped" | "unknown";
	lastHeartbeat?: string;
	activeRoutes?: number;
	successRate?: number;
};

type ProfitPoint = {
	time: string;
	profit: number;
};

type ProfitSummary = {
	today: number;
	total: number;
	history: ProfitPoint[];
};

type Opportunity = {
	pair: string;
	dexA: string;
	dexB: string;
	profit: string;
	timestamp: string;
};

type Trade = {
	id: string;
	route: string;
	profit: string;
	status: string;
	time: string;
};

type WalletInitPayload = {
	wallet: string;
	usdcAccount: string;
};

type LogEntry = {
	level: "success" | "failure" | "info";
	message: string;
	profit?: string;
	signature?: string;
	flashLoanAmount?: string;
	swapDetails?: string;
	failureReason?: string;
	timestamp: string;
};

type WebsocketMessage = {
	type: "status" | "profit" | "opportunity" | "trade";
	payload: unknown;
};

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const clients = new Set<WebSocket>();

let status: BotStatus = {
	status: "stopped",
	lastHeartbeat: new Date().toISOString(),
	activeRoutes: 0,
	successRate: 0,
};

let simulationEnabled = true;
let settingsOverrides: Record<string, unknown> = {};

function broadcast(message: WebsocketMessage): void {
	const payload = JSON.stringify(message);
	for (const client of clients) {
		if (client.readyState === WebSocket.OPEN) {
			client.send(payload);
		}
	}
}

function readLogs(): LogEntry[] {
	if (!fs.existsSync(LOG_FILE)) return [];
	const raw = fs.readFileSync(LOG_FILE, "utf-8");
	const lines = raw.split("\n").filter(Boolean);
	const entries: LogEntry[] = [];

	for (const line of lines) {
		try {
			entries.push(JSON.parse(line) as LogEntry);
		} catch {
			// Ignore malformed lines
		}
	}

	return entries;
}

function sumProfit(entries: LogEntry[]): number {
	return entries.reduce((acc, entry) => {
		if (!entry.profit) return acc;
		const parsed = Number(entry.profit);
		return Number.isFinite(parsed) ? acc + parsed : acc;
	}, 0);
}

function buildProfitSummary(entries: LogEntry[]): ProfitSummary {
	const today = new Date().toISOString().slice(0, 10);
	const todayEntries = entries.filter((entry) =>
		entry.timestamp.startsWith(today)
	);

	const history = entries
		.filter((entry) => Boolean(entry.profit))
		.slice(-20)
		.map((entry) => ({
			time: entry.timestamp,
			profit: Number(entry.profit ?? 0),
		}));

	return {
		today: sumProfit(todayEntries),
		total: sumProfit(entries),
		history,
	};
}

function buildTrades(entries: LogEntry[]): Trade[] {
	const trades = entries
		.filter((entry) => entry.level === "success" || entry.level === "failure")
		.slice(-100)
		.map((entry) => ({
			id: entry.signature ?? entry.timestamp,
			route: entry.swapDetails ?? "Jupiter route",
			profit: entry.profit ?? "0",
			status: entry.level === "success" ? "success" : "failed",
			time: entry.timestamp,
		}));

	return trades.reverse();
}

function buildOpportunities(entries: LogEntry[]): Opportunity[] {
	const opportunities = entries
		.filter((entry) => entry.message.toLowerCase().includes("opportunity"))
		.slice(-50)
		.map((entry) => ({
			pair: "USDC/SOL",
			dexA: "Jupiter",
			dexB: "Jupiter",
			profit: entry.profit ?? "0",
			timestamp: entry.timestamp,
		}));

	if (opportunities.length > 0) return opportunities.reverse();

	return [];
}

function buildStatus(): BotStatus {
	return {
		...status,
		lastHeartbeat: new Date().toISOString(),
	};
}

function updateEnvFile(updates: Record<string, string>): void {
	if (!fs.existsSync(ENV_PATH)) return;
	const raw = fs.readFileSync(ENV_PATH, "utf-8");
	let lines = raw.split(/\r?\n/);

	for (const [key, value] of Object.entries(updates)) {
		let updated = false;
		lines = lines.map((line) => {
			if (!line.trim().startsWith(`${key}=`)) return line;
			updated = true;
			return `${key}=${value}`;
		});
		if (!updated) {
			lines.push(`${key}=${value}`);
		}
	}

	fs.writeFileSync(ENV_PATH, lines.join("\n"), "utf-8");
}

function getSnapshot() {
	const entries = readLogs();
	return {
		status: buildStatus(),
		profit: buildProfitSummary(entries),
		opportunities: buildOpportunities(entries),
		trades: buildTrades(entries),
	};
}

app.get("/api/status", (_req, res) => {
	res.json(buildStatus());
});

app.get("/api/profit", (_req, res) => {
	const entries = readLogs();
	res.json(buildProfitSummary(entries));
});

app.get("/api/opportunities", (_req, res) => {
	const entries = readLogs();
	res.json(buildOpportunities(entries));
});

app.get("/api/trades", (_req, res) => {
	const entries = readLogs();
	res.json(buildTrades(entries));
});

app.post("/api/start", (_req, res) => {
	status = { ...status, status: "running" };
	broadcast({ type: "status", payload: buildStatus() });
	res.status(200).json({ ok: true });
});

app.post("/api/stop", (_req, res) => {
	status = { ...status, status: "stopped" };
	broadcast({ type: "status", payload: buildStatus() });
	res.status(200).json({ ok: true });
});

app.post("/api/simulation", (req, res) => {
	simulationEnabled = Boolean(req.body?.enabled);
	res.status(200).json({ ok: true, enabled: simulationEnabled });
});

app.post("/api/settings", (req, res) => {
	settingsOverrides = {
		...settingsOverrides,
		...(req.body as Record<string, unknown>),
	};
	res.status(200).json({ ok: true });
});

const handleWalletInit = (req: express.Request, res: express.Response) => {
	const { wallet, usdcAccount } = (req.body as WalletInitPayload) ?? {};

	if (!wallet || !usdcAccount) {
		res.status(400).json({ error: "wallet, usdcAccount required" });
		return;
	}

	process.env.INPUT_TOKEN_ACCOUNT = usdcAccount;

	updateEnvFile({
		INPUT_TOKEN_ACCOUNT: usdcAccount,
	});

	writeRuntimeSettings({
		wallet,
		inputTokenAccount: usdcAccount,
	});

	res.status(200).json({ ok: true });
};

app.post("/api/wallet/init", handleWalletInit);
app.post("/wallet/init", handleWalletInit);

wss.on("connection", (socket) => {
	clients.add(socket);

	const snapshot = getSnapshot();
	socket.send(JSON.stringify({ type: "status", payload: snapshot.status }));
	socket.send(JSON.stringify({ type: "profit", payload: snapshot.profit }));

	for (const opportunity of snapshot.opportunities) {
		socket.send(
			JSON.stringify({ type: "opportunity", payload: opportunity })
		);
	}

	for (const trade of snapshot.trades) {
		socket.send(JSON.stringify({ type: "trade", payload: trade }));
	}

	socket.on("close", () => clients.delete(socket));
});

setInterval(() => {
	const snapshot = getSnapshot();
	broadcast({ type: "status", payload: snapshot.status });
	broadcast({ type: "profit", payload: snapshot.profit });
}, 5000);

server.listen(PORT, () => {
	console.log(`API server listening on http://localhost:${PORT}`);
});
