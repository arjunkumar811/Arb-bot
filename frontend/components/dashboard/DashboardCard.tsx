import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type DashboardCardProps = {
	title: string;
	subtitle?: string;
	children: ReactNode;
};

export function DashboardCard({
	title,
	subtitle,
	children,
}: DashboardCardProps): JSX.Element {
	return (
		<Card className="bg-slate-900/70 shadow-lg">
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle className="text-sm">{title}</CardTitle>
					{subtitle ? (
						<p className="mt-1 text-xs text-slate-400">{subtitle}</p>
					) : null}
				</div>
			</CardHeader>
			<CardContent className="pt-0">{children}</CardContent>
		</Card>
	);
}
