import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { Trade } from "../../lib/api";

type LastTradeCardProps = {
	trade: Trade | null;
};

// Render the latest trade summary for the dashboard.
export function LastTradeCard({ trade }: LastTradeCardProps): JSX.Element {
	const status = trade?.status ?? "--";
	const profit = trade?.profit ?? "--";
	const route = trade?.route ?? "--";
	const time = trade?.time ?? "--";

	return (
		<Card className="bg-slate-900/70 shadow-lg">
			<CardHeader>
				<CardTitle className="text-sm">Last Trade</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2 pt-0 text-xs text-slate-300">
				<div className="flex items-center justify-between">
					<span className="text-slate-500">Status</span>
					<span className="text-right text-slate-200">{status}</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-slate-500">Profit</span>
					<span className="text-right text-emerald-300">{profit}</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-slate-500">Route</span>
					<span className="text-right text-slate-200">{route}</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-slate-500">Time</span>
					<span className="text-right text-slate-200">{time}</span>
				</div>
			</CardContent>
		</Card>
	);
}
