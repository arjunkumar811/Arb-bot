import { Card, CardContent } from "../ui/card";

type StatusCardProps = {
	label: string;
	value: string;
	detail?: string;
};

export function StatusCard({ label, value, detail }: StatusCardProps): JSX.Element {
	return (
		<Card className="bg-slate-900/70 shadow-lg">
			<CardContent className="p-5">
				<p className="text-xs uppercase tracking-widest text-slate-500">
					{label}
				</p>
				<div className="mt-3">
					<p className="text-2xl font-semibold text-white">{value}</p>
					{detail ? (
						<p className="mt-1 text-xs text-slate-400">{detail}</p>
					) : null}
				</div>
			</CardContent>
		</Card>
	);
}
