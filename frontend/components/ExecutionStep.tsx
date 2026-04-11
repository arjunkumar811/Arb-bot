import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export type StepStatus = "pending" | "running" | "success" | "failed";

type ExecutionStepProps = {
	index: number;
	title: string;
	status: StepStatus;
	timestamp?: string;
	signature?: string;
	durationMs?: number;
};

const statusStyles: Record<StepStatus, string> = {
	pending: "text-slate-500",
	running: "text-sky-400",
	success: "text-emerald-400",
	failed: "text-rose-400",
};

export function ExecutionStep({
	index,
	title,
	status,
	timestamp,
	signature,
	durationMs,
}: ExecutionStepProps): JSX.Element {
	return (
		<div className="flex items-start gap-3 rounded-lg border border-slate-800/60 bg-slate-950/60 p-3">
			<div className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-800 text-xs text-slate-400">
				{index}
			</div>
			<div className="flex-1">
				<div className="flex items-center justify-between">
					<p className={`text-sm font-medium ${statusStyles[status]}`}>
						{title}
						{durationMs !== undefined ? ` - ${durationMs}ms` : ""}
					</p>
					<span className="text-[11px] text-slate-500">
						{timestamp ? new Date(timestamp).toLocaleTimeString() : "--"}
					</span>
				</div>
				{signature ? (
					<p className="mt-1 truncate text-[11px] text-slate-400">
						Signature: {signature}
					</p>
				) : null}
			</div>
			<div className="pt-1">
				{status === "running" ? (
					<Loader2 className="h-4 w-4 animate-spin text-sky-400" />
				) : null}
				{status === "success" ? (
					<CheckCircle2 className="h-4 w-4 text-emerald-400" />
				) : null}
				{status === "failed" ? (
					<XCircle className="h-4 w-4 text-rose-400" />
				) : null}
				{status === "pending" ? (
					<div className="h-2 w-2 rounded-full bg-slate-600" />
				) : null}
			</div>
		</div>
	);
}
