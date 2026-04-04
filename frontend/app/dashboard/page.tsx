import { DashboardLayout } from "../../components/layout";

export default function DashboardPage(): JSX.Element {
	return (
		<DashboardLayout
			title="Dashboard"
			subtitle="Live Solana flash-loan arbitrage overview"
		>
			<div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
				Dashboard widgets will render here.
			</div>
		</DashboardLayout>
	);
}
