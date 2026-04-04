import { DashboardLayout } from "../../components/layout";

export default function TradesPage(): JSX.Element {
	return (
		<DashboardLayout title="Trades" subtitle="Execution history and performance">
			<div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
				Trade history table will render here.
			</div>
		</DashboardLayout>
	);
}
