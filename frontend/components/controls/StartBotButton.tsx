"use client";

import { useState } from "react";
import { Button } from "../ui/button";

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
		<Button onClick={startBot} disabled={loading} size="sm">
			{loading ? "Starting..." : "Start Bot"}
		</Button>
	);
}
