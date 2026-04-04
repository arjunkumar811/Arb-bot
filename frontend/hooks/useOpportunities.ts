"use client";

import { useEffect, useState } from "react";
import { getOpportunities, Opportunity } from "../lib/api";
import { connectWebsocket } from "../lib/websocket";

const WS_URL = "ws://localhost:3001";

export type OpportunitiesState = {
	opportunities: Opportunity[];
	loading: boolean;
	error?: string;
};

export function useOpportunities(): OpportunitiesState {
	const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | undefined>();

	useEffect(() => {
		let socket: WebSocket | null = null;
		let active = true;

		const load = async (): Promise<void> => {
			try {
				const data = await getOpportunities();
				if (!active) return;
				setOpportunities(data);
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
				if (message.type === "opportunity") {
					setOpportunities((prev) => {
						const next = message.payload as Opportunity;
						return [next, ...prev].slice(0, 50);
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

	return { opportunities, loading, error };
}
