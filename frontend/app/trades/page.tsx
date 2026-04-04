import { DashboardLayout } from "../../components/layout";
import { TradeHistoryTable } from "../../components/trades/TradeHistoryTable";

export default function TradesPage(): JSX.Element {
	const trades = [
		{
			id: "TX-9021",
			route: "SOL/USDC -> SOL",
			profit: "+$12.40",
			status: "Success",
			time: "2m ago",
		},
		{
			id: "TX-9018",
			route: "mSOL/USDT -> mSOL",
			profit: "+$7.12",
			status: "Success",
			time: "5m ago",
		},
		{
			id: "TX-9012",
			route: "SOL/USDT -> SOL",
			profit: "-$3.25",
			status: "Failed",
			time: "12m ago",
		},
	];

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
