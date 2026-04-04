"use client";

import { useState } from "react";

export function SlippageSettings(): JSX.Element {
	const [value, setValue] = useState("0.5");
	const [loading, setLoading] = useState(false);

	const save = async (): Promise<void> => {
		setLoading(true);
		try {
			await fetch("/api/settings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ slippage: value }),
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
			<h3 className="text-sm font-semibold text-white">Slippage</h3>
			<p className="mt-1 text-xs text-slate-400">
				Maximum slippage percentage
			</p>
			<div className="mt-4 flex items-center gap-3">
				<input
					className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
					value={value}
					onChange={(event) => setValue(event.target.value)}
					placeholder="0.5"
				/>
				<button
					onClick={save}
					className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950"
					disabled={loading}
				>
					{loading ? "Saving..." : "Save"}
				</button>
			</div>
		</div>
	);
}
