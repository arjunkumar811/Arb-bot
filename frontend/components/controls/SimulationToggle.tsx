"use client";

import { useState } from "react";

export function SimulationToggle(): JSX.Element {
	const [enabled, setEnabled] = useState(false);
	const [loading, setLoading] = useState(false);

	const toggle = async (): Promise<void> => {
		const next = !enabled;
		setEnabled(next);
		setLoading(true);
		try {
			await fetch("/api/simulation", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ enabled: next }),
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<button
			onClick={toggle}
			className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-emerald-400 hover:text-white disabled:opacity-60"
			disabled={loading}
		>
			{loading ? "Updating..." : enabled ? "Simulation: On" : "Simulation: Off"}
		</button>
	);
}
