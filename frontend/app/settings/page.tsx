import { DashboardLayout } from "../../components/layout";

export default function SettingsPage(): JSX.Element {
	return (
		<DashboardLayout title="Settings" subtitle="Strategy parameters">
			<div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
				Settings controls will render here.
			</div>
		</DashboardLayout>
	);
}
