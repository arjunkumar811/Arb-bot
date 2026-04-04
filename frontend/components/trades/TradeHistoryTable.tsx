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
		<div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-semibold text-white">Trade History</h3>
				<span className="text-xs text-slate-500">Last 50</span>
			</div>
			<div className="mt-4 overflow-x-auto">
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
		</div>
	);
}
