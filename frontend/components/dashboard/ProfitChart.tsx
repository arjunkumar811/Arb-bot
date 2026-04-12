"use client";
"use client";
import {
	Area,
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
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
							<defs>
								<linearGradient id="profitGlow" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor="#38bdf8" stopOpacity={0.35} />
									<stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
								</linearGradient>
							</defs>
							<CartesianGrid stroke="#1f2937" strokeDasharray="4 4" />
							<XAxis
								dataKey="time"
								stroke="#94a3b8"
								fontSize={12}
								tickFormatter={(value: string) => value.slice(11, 16)}
							/>
							<YAxis stroke="#94a3b8" fontSize={12} />
							<Tooltip
								contentStyle={{
									backgroundColor: "#0b1220",
									border: "1px solid #1f2937",
									color: "#e2e8f0",
								}}
							/>
							<Area
								type="monotone"
								dataKey="profit"
								stroke="none"
								fill="url(#profitGlow)"
							/>
							<Line
								type="monotone"
								dataKey="profit"
								stroke="#38bdf8"
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
