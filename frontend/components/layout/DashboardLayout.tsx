import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

type DashboardLayoutProps = {
	children: ReactNode;
	title: string;
	subtitle?: string;
	botStatus?: "running" | "stopped" | "simulation" | "error";
};

export function DashboardLayout({
	children,
	title,
	subtitle,
	botStatus = "stopped",
}: DashboardLayoutProps): JSX.Element {
	return (
		<div className="min-h-screen bg-slate-950 text-slate-100">
			<div className="flex min-h-screen">
				<Sidebar />
				<div className="flex min-h-screen flex-1 flex-col">
					<Navbar botStatus={botStatus} />
					<main className="flex-1 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-6 py-6">
						{children}
					</main>
				</div>
			</div>
		</div>
	);
}
