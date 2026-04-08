import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type TradeRow = {
	id: string;
	route: string;
	profit: string;
	status: string;
	time: string;
};

type TradeHistoryTableProps = {
	rows: TradeRow[];
};

export function TradeHistoryTable({ rows }: TradeHistoryTableProps): JSX.Element {
	return (
		<Card className="bg-slate-900/70 shadow-lg">
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="text-sm">Trade History</CardTitle>
				<span className="text-xs text-slate-500">Last 50</span>
			</CardHeader>
			<CardContent className="pt-0">
				<div className="overflow-x-auto">
				<table className="w-full text-left text-sm">
					<thead className="text-xs uppercase tracking-wide text-slate-500">
						<tr className="border-b border-slate-800">
							<th className="py-3">Trade ID</th>
							<th className="py-3">Route</th>
							<th className="py-3">Profit</th>
							<th className="py-3">Status</th>
							<th className="py-3">Time</th>
						</tr>
					</thead>
					<tbody className="text-slate-200">
						{rows.map((row) => (
							<tr key={row.id} className="border-b border-slate-800/60">
								<td className="py-3 font-medium text-white">{row.id}</td>
								<td className="py-3">{row.route}</td>
								<td className="py-3 text-emerald-300">{row.profit}</td>
								<td className="py-3 text-slate-400">{row.status}</td>
								<td className="py-3 text-slate-400">{row.time}</td>
							</tr>
						))}
					</tbody>
				</table>
				</div>
			</CardContent>
		</Card>
	);
}
