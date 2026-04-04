"use client";

import { useEffect, useState } from "react";
import { BotStatus, getProfit, getStatus, ProfitSummary } from "../lib/api";
import { connectWebsocket } from "../lib/websocket";

const WS_URL = "ws://localhost:3001";

export type BotStatusState = {
	status: BotStatus | null;
	profit: ProfitSummary | null;
	loading: boolean;
	error?: string;
};

export function useBotStatus(): BotStatusState {
	const [status, setStatus] = useState<BotStatus | null>(null);
	const [profit, setProfit] = useState<ProfitSummary | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | undefined>();

	useEffect(() => {
		let socket: WebSocket | null = null;
		let active = true;

		const load = async (): Promise<void> => {
			try {
				const [statusData, profitData] = await Promise.all([
					getStatus(),
					getProfit(),
				]);
				if (!active) return;
				setStatus(statusData);
				setProfit(profitData);
				setLoading(false);
			} catch (err) {
				if (!active) return;
				setError((err as Error).message);
				setLoading(false);
			}
		};

		load();

		socket = connectWebsocket(WS_URL, {
			onMessage: (message) => {
				if (!active) return;
				if (message.type === "status") {
					setStatus(message.payload as BotStatus);
				}
				if (message.type === "profit") {
					setProfit(message.payload as ProfitSummary);
				}
			},
		});

		const interval = setInterval(load, 15000);

		return () => {
			active = false;
			clearInterval(interval);
			if (socket) socket.close();
		};
	}, []);

	return { status, profit, loading, error };
}
