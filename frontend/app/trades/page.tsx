"use client";

import { DashboardLayout } from "../../components/layout";
import { TradeHistoryTable } from "../../components/trades/TradeHistoryTable";
import { useExecutionHistory } from "../../hooks/useExecutionHistory";

export default function TradesPage(): JSX.Element {
	const history = useExecutionHistory();
	const trades = history.map((run) => ({
		id: run.id,
		route: `${run.stepsCompleted}/8 steps`,
		profit: run.profit,
		status: run.status,
		signature: run.signature ?? "--",
		time: run.timestamp,
	}));

	return (
		<DashboardLayout title="Trades" subtitle="Execution history and performance">
			<TradeHistoryTable rows={trades} />
			<div className="mt-4 flex items-center justify-between text-xs text-slate-500">
				<span>Showing {Math.min(trades.length, 50)} of 50</span>
				<div className="flex gap-2">
					<button className="rounded-lg border border-slate-800 px-3 py-1">
						Prev
					</button>
					<button className="rounded-lg border border-slate-800 px-3 py-1">
						Next
					</button>
				</div>
			</div>
		</DashboardLayout>
	);
}
