type StatusCardProps = {
	label: string;
	value: string;
	detail?: string;
};

export function StatusCard({ label, value, detail }: StatusCardProps): JSX.Element {
	return (
		<div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg">
			<p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>
			<div className="mt-3">
				<p className="text-2xl font-semibold text-white">{value}</p>
				{detail ? (
					<p className="mt-1 text-xs text-slate-400">{detail}</p>
				) : null}
			</div>
		</div>
	);
}
