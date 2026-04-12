type StatsCardProps = {
	label: string;
	value: string;
	hint?: string;
};

export function StatsCard({ label, value, hint }: StatsCardProps): JSX.Element {
	return (
		<div className="rounded-xl border border-slate-700/80 bg-slate-800/70 p-4 shadow-md">
			<p className="text-xs uppercase tracking-widest text-slate-400">{label}</p>
			<p className="mt-2 text-2xl font-semibold text-white">{value}</p>
			{hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
		</div>
	);
}
