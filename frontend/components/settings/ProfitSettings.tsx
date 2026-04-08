"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export function ProfitSettings(): JSX.Element {
	const [value, setValue] = useState("0");
	const [loading, setLoading] = useState(false);

	const save = async (): Promise<void> => {
		setLoading(true);
		try {
			await fetch("/api/settings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ minimumProfitThreshold: value }),
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="bg-slate-900/70 shadow-lg">
			<CardHeader>
				<CardTitle className="text-sm">Profit Threshold</CardTitle>
				<p className="mt-1 text-xs text-slate-400">
					Minimum profit in lamports
				</p>
			</CardHeader>
			<CardContent className="pt-0">
				<div className="flex items-center gap-3">
					<input
						className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
						value={value}
						onChange={(event) => setValue(event.target.value)}
						placeholder="1000"
					/>
					<Button onClick={save} size="sm" disabled={loading}>
						{loading ? "Saving..." : "Save"}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
