"use client";

import { useEffect, useState } from "react";
import { getTrades, Trade } from "../lib/api";
import { connectWebsocket } from "../lib/websocket";

const WS_URL = "ws://localhost:3001";

export type TradesState = {
	trades: Trade[];
	loading: boolean;
	error?: string;
};

export function useTrades(): TradesState {
	const [trades, setTrades] = useState<Trade[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | undefined>();

	useEffect(() => {
		let socket: WebSocket | null = null;
		let active = true;

		const load = async (): Promise<void> => {
			try {
				const data = await getTrades();
				if (!active) return;
				setTrades(data);
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
				if (message.type === "trade") {
					setTrades((prev) => {
						const next = message.payload as Trade;
						return [next, ...prev].slice(0, 100);
					});
				}
			},
		});

		const interval = setInterval(load, 20000);

		return () => {
			active = false;
			clearInterval(interval);
			if (socket) socket.close();
		};
	}, []);

	return { trades, loading, error };
}
