type OpportunityRow = {
	pair: string;
	dexA: string;
	dexB: string;
	profit: string;
	timestamp: string;
};

type OpportunityTableProps = {
	rows: OpportunityRow[];
};

export function OpportunityTable({ rows }: OpportunityTableProps): JSX.Element {
	return (
		<div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-semibold text-white">Active Opportunities</h3>
				<span className="text-xs text-slate-500">Live routes</span>
			</div>
			<div className="mt-4 overflow-x-auto">
				<table className="w-full text-left text-sm">
					<thead className="text-xs uppercase tracking-wide text-slate-500">
						<tr className="border-b border-slate-800">
							<th className="py-3">Pair</th>
							<th className="py-3">DEX A</th>
							<th className="py-3">DEX B</th>
							<th className="py-3">Profit</th>
							<th className="py-3">Timestamp</th>
						</tr>
					</thead>
					<tbody className="text-slate-200">
						{rows.map((row) => (
							<tr key={`${row.pair}-${row.timestamp}`} className="border-b border-slate-800/60">
								<td className="py-3 font-medium text-white">{row.pair}</td>
								<td className="py-3">{row.dexA}</td>
								<td className="py-3">{row.dexB}</td>
								<td className="py-3 text-emerald-300">{row.profit}</td>
								<td className="py-3 text-slate-400">{row.timestamp}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
