"use client";

import { useState } from "react";

export function StartBotButton(): JSX.Element {
	const [loading, setLoading] = useState(false);

	const startBot = async (): Promise<void> => {
		setLoading(true);
		try {
			await fetch("/api/start", { method: "POST" });
		} finally {
			setLoading(false);
		}
	};

	return (
		<button
			onClick={startBot}
			className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
			disabled={loading}
		>
			{loading ? "Starting..." : "Start Bot"}
		</button>
	);
}
