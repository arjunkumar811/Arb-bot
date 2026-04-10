export type BotStatus = {
	status: "running" | "stopped" | "unknown";
	lastHeartbeat?: string;
	activeRoutes?: number;
	successRate?: number;
};

export type ProfitPoint = {
	time: string;
	profit: number;
};

export type ProfitSummary = {
	today: number;
	total: number;
	history: ProfitPoint[];
};

export type Opportunity = {
	pair: string;
	dexA: string;
	dexB: string;
	profit: string;
	timestamp: string;
};

export type Trade = {
	id: string;
	route: string;
	profit: string;
	status: string;
	time: string;
};

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
	const response = await fetch(input, init);
	if (!response.ok) {
		throw new Error(`Request failed: ${response.status}`);
	}
	return (await response.json()) as T;
}

export function getStatus(): Promise<BotStatus> {
	return fetchJson<BotStatus>("/api/status");
}

export function getProfit(): Promise<ProfitSummary> {
	return fetchJson<ProfitSummary>("/api/profit");
}

export function getOpportunities(): Promise<Opportunity[]> {
	return fetchJson<Opportunity[]>("/api/opportunities");
}

export function getTrades(): Promise<Trade[]> {
	return fetchJson<Trade[]>("/api/trades");
}

export function startBot(): Promise<void> {
	return fetchJson<void>("/api/start", { method: "POST" });
}

export function stopBot(): Promise<void> {
	return fetchJson<void>("/api/stop", { method: "POST" });
}

export function setSimulation(enabled: boolean): Promise<void> {
	return fetchJson<void>("/api/simulation", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ enabled }),
	});
}

export function updateSettings(payload: Record<string, unknown>): Promise<void> {
	return fetchJson<void>("/api/settings", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
}

export type WalletInitPayload = {
	wallet: string;
	usdcAccount: string;
};

export function initWallet(payload: WalletInitPayload): Promise<void> {
	return fetchJson<void>("/api/wallet/init", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
}
