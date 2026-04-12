import { useEffect, useRef } from "react";

type LogUpdate = {
	message: string;
	timestamp: string;
};

type LogsConsoleProps = {
	logs: LogUpdate[];
};

export function LogsConsole({ logs }: LogsConsoleProps): JSX.Element {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const autoScrollRef = useRef(true);

	useEffect(() => {
		if (!autoScrollRef.current) return;
		const container = containerRef.current;
		if (!container) return;
		requestAnimationFrame(() => {
			container.scrollTop = container.scrollHeight;
		});
	}, [logs]);

	return (
		<div
			ref={containerRef}
			onScroll={() => {
				const container = containerRef.current;
				if (!container) return;
				const distanceFromBottom =
					container.scrollHeight -
					container.scrollTop -
					container.clientHeight;
				autoScrollRef.current = distanceFromBottom < 48;
			}}
			className="h-80 overflow-y-auto rounded-xl border border-slate-700/80 bg-slate-950/80 p-4 font-mono text-xs text-slate-300 shadow-inner"
		>
			{logs.length === 0 ? (
				<p className="text-slate-500">No logs yet...</p>
			) : (
				logs.map((log, index) => {
					const message = log.message.toLowerCase();
					const tone = message.includes("failed")
						? "text-rose-300"
						: message.includes("success")
						? "text-emerald-300"
						: "text-sky-300";
					return (
						<p key={`${log.timestamp}-${index}`} className={tone}>
							[{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
						</p>
					);
				})
			)}
		</div>
	);
}
