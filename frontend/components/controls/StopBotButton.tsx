"use client";

import { useState } from "react";
import { Button } from "../ui/button";

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
		<Button onClick={stopBot} disabled={loading} size="sm" variant="outline">
			{loading ? "Stopping..." : "Stop Bot"}
		</Button>
	);
}
