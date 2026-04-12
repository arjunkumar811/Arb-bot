type StatusBadgeProps = {
	label: string;
	status: "running" | "stopped" | "simulation" | "error";
};

const STATUS_STYLES: Record<StatusBadgeProps["status"], string> = {
	running: "bg-emerald-500/15 text-emerald-300",
	simulation: "bg-amber-500/15 text-amber-300",
	error: "bg-rose-500/15 text-rose-300",
	stopped: "bg-slate-700/60 text-slate-300",
};

const DOT_STYLES: Record<StatusBadgeProps["status"], string> = {
	running: "bg-emerald-400",
	simulation: "bg-amber-400",
	error: "bg-rose-400",
	stopped: "bg-slate-400",
};

export function StatusBadge({ label, status }: StatusBadgeProps): JSX.Element {
	return (
		<span
			className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
				STATUS_STYLES[status]
			}`}
		>
			<span className={`h-2 w-2 rounded-full ${DOT_STYLES[status]}`} />
			{label}
		</span>
	);
}
