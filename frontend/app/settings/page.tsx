import { DashboardLayout } from "../../components/layout";
import { ProfitSettings } from "../../components/settings/ProfitSettings";
import { SlippageSettings } from "../../components/settings/SlippageSettings";

export default function SettingsPage(): JSX.Element {
	return (
		<DashboardLayout title="Settings" subtitle="Strategy parameters">
			<div className="grid gap-6 lg:grid-cols-2">
				<ProfitSettings />
				<SlippageSettings />
			</div>
		</DashboardLayout>
	);
}
