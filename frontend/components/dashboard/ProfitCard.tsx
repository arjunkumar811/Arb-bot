type ProfitCardProps = {
	label: string;
	value: string;
	trend?: string;
};

export function ProfitCard({ label, value, trend }: ProfitCardProps): JSX.Element {
	return (
		<div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg">
			<p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>
			<div className="mt-3 flex items-end justify-between">
				<p className="text-2xl font-semibold text-white">{value}</p>
				{trend ? (
					<span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300">
						{trend}
					</span>
				) : null}
			</div>
		</div>
	);
}
