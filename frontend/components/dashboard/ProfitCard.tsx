import { Card, CardContent } from "../ui/card";

type ProfitCardProps = {
	label: string;
	value: string;
	trend?: string;
};

export function ProfitCard({ label, value, trend }: ProfitCardProps): JSX.Element {
	return (
		<Card className="bg-slate-900/70 shadow-lg">
			<CardContent className="p-5">
				<p className="text-xs uppercase tracking-widest text-slate-500">
					{label}
				</p>
				<div className="mt-3 flex items-end justify-between">
					<p className="text-2xl font-semibold text-white">{value}</p>
					{trend ? (
						<span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300">
							{trend}
						</span>
					) : null}
				</div>
			</CardContent>
		</Card>
	);
}
