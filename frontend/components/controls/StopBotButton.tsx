"use client";

import { useState } from "react";

export function StopBotButton(): JSX.Element {
	const [loading, setLoading] = useState(false);

	const stopBot = async (): Promise<void> => {
		setLoading(true);
		try {
			await fetch("/api/stop", { method: "POST" });
		} finally {
			setLoading(false);
		}
	};

	return (
		<button
			onClick={stopBot}
			className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-rose-400 hover:text-white disabled:opacity-60"
			disabled={loading}
		>
			{loading ? "Stopping..." : "Stop Bot"}
		</button>
	);
}
