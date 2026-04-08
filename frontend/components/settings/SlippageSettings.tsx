"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

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
		<Card className="bg-slate-900/70 shadow-lg">
			<CardHeader>
				<CardTitle className="text-sm">Slippage</CardTitle>
				<p className="mt-1 text-xs text-slate-400">
					Maximum slippage percentage
				</p>
			</CardHeader>
			<CardContent className="pt-0">
				<div className="flex items-center gap-3">
					<input
						className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
						value={value}
						onChange={(event) => setValue(event.target.value)}
						placeholder="0.5"
					/>
					<Button onClick={save} size="sm" disabled={loading}>
						{loading ? "Saving..." : "Save"}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
