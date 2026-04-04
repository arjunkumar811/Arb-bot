import { ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

type DashboardLayoutProps = {
	children: ReactNode;
	title: string;
	subtitle?: string;
};

export function DashboardLayout({
	children,
	title,
	subtitle,
}: DashboardLayoutProps): JSX.Element {
	return (
		<div className="min-h-screen bg-slate-950 text-slate-100">
			<div className="flex min-h-screen">
				<Sidebar />
				<div className="flex min-h-screen flex-1 flex-col">
					<Header title={title} subtitle={subtitle} />
					<main className="flex-1 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-8 py-6">
						{children}
					</main>
				</div>
			</div>
		</div>
	);
}
