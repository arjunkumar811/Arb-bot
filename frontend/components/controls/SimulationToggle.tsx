"use client";

import { useState } from "react";
import { Button } from "../ui/button";

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
		<Button onClick={toggle} disabled={loading} size="sm" variant="outline">
			{loading ? "Updating..." : enabled ? "Simulation: On" : "Simulation: Off"}
		</Button>
	);
}
