"use client";

import {	CartesianGrid,	Line,	LineChart,	ResponsiveContainer,	Tooltip,	XAxis,	YAxis,	} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type ProfitPoint = {
	time: string;
	profit: number;
};

type ProfitChartProps = {
	data: ProfitPoint[];
};

export function ProfitChart({ data }: ProfitChartProps): JSX.Element {
	return (
		<Card className="bg-slate-900/70 shadow-lg">
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="text-sm">Profit Over Time</CardTitle>
				<span className="text-xs text-slate-500">Last 24h</span>
			</CardHeader>
			<CardContent className="pt-0">
				<div className="h-64">
				<ResponsiveContainer width="100%" height="100%">
					<LineChart data={data}>
						<CartesianGrid stroke="#1e293b" strokeDasharray="4 4" />
						<XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
						<YAxis stroke="#94a3b8" fontSize={12} />
						<Tooltip
							contentStyle={{
								backgroundColor: "#0f172a",
								border: "1px solid #1e293b",
								color: "#e2e8f0",
							}}
						/>
						<Line
							type="monotone"
							dataKey="profit"
							stroke="#22c55e"
							strokeWidth={2}
							dot={false}
						/>
					</LineChart>
				</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
}
