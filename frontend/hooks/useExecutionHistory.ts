"use client";

import { useEffect, useRef, useState } from "react";
import { getSocket } from "../lib/socket";

export type ExecutionUpdatePayload = {
	step: string;
	status?: "pending" | "running" | "success" | "failed";
	timestamp?: string;
	transactionSignature?: string;
};

export type ExecutionRun = {
	id: string;
	stepsCompleted: number;
	profit: string;
	signature?: string;
	status: "success" | "failed" | "running";
	timestamp: string;
};

export function useExecutionHistory(): ExecutionRun[] {
	const [history, setHistory] = useState<ExecutionRun[]>([]);
	const lastProfitRef = useRef<string>("0");
	const stepsCompletedRef = useRef<number>(0);

	useEffect(() => {
		const socket = getSocket();

		socket.on("arb_update", (payload: { profit?: string }) => {
			if (payload?.profit) {
				lastProfitRef.current = payload.profit;
			}
		});

		socket.on("execution_update", (payload: ExecutionUpdatePayload) => {
			if (payload.status === "success") {
				stepsCompletedRef.current += 1;
			}

			if (payload.step === "confirmed") {
				const id = payload.transactionSignature ?? new Date().toISOString();
				const status = payload.status === "failed" ? "failed" : "success";
				const run: ExecutionRun = {
					id,
					stepsCompleted: stepsCompletedRef.current,
					profit: lastProfitRef.current,
					signature: payload.transactionSignature,
					status,
					timestamp: payload.timestamp ?? new Date().toISOString(),
				};

				stepsCompletedRef.current = 0;
				setHistory((prev) => [run, ...prev].slice(0, 50));
			}
		});

		return () => {
			socket.off("arb_update");
			socket.off("execution_update");
		};
	}, []);

	return history;
}
