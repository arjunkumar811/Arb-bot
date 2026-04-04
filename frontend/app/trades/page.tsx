"use client";

import { DashboardLayout } from "../../components/layout";
import { TradeHistoryTable } from "../../components/trades/TradeHistoryTable";
import { useTrades } from "../../hooks/useTrades";

export default function TradesPage(): JSX.Element {
	const { trades } = useTrades();

	return (
		<DashboardLayout title="Trades" subtitle="Execution history and performance">
			<TradeHistoryTable rows={trades} />
			<div className="mt-4 flex items-center justify-between text-xs text-slate-500">
				<span>Showing 1-3 of 50</span>
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
