"use client";

import { DashboardLayout } from "../../components/layout";
import { ProfitCard } from "../../components/dashboard/ProfitCard";
import { StatusCard } from "../../components/dashboard/StatusCard";
import { OpportunityTable } from "../../components/dashboard/OpportunityTable";
import { ProfitChart } from "../../components/dashboard/ProfitChart";
import { QuoteCard } from "../../components/dashboard/QuoteCard";
import { LastTradeCard } from "../../components/dashboard/LastTradeCard";
import { StartBotButton } from "../../components/controls/StartBotButton";
import { StopBotButton } from "../../components/controls/StopBotButton";
import { SimulationToggle } from "../../components/controls/SimulationToggle";
import { useBotStatus } from "../../hooks/useBotStatus";
import { useOpportunities } from "../../hooks/useOpportunities";
import { useQuotes } from "../../hooks/useQuotes";
import { useTrades } from "../../hooks/useTrades";

export default function DashboardPage(): JSX.Element {
	const { status, profit } = useBotStatus();
	const { opportunities } = useOpportunities();
	const { forward, reverse, loading: quotesLoading, error: quotesError } =
		useQuotes();
	const { trades } = useTrades();
	const lastTrade = trades[0] ?? null;

	const profitData =
		profit?.history ?? [
			{ time: "00:00", profit: 120 },
			{ time: "04:00", profit: 260 },
			{ time: "08:00", profit: 180 },
			{ time: "12:00", profit: 340 },
			{ time: "16:00", profit: 420 },
			{ time: "20:00", profit: 390 },
		];

	return (
		<DashboardLayout
			title="Dashboard"
			subtitle="Live Solana flash-loan arbitrage overview"
		>
			<div className="grid gap-6 xl:grid-cols-4">
				<ProfitCard
					label="Profit Today"
					value={`$${profit?.today ?? 0}`}
					trend="+12.4%"
				/>
				<ProfitCard
					label="Profit Total"
					value={`$${profit?.total ?? 0}`}
					trend="+4.1%"
				/>
				<StatusCard
					label="Active Routes"
					value={`${status?.activeRoutes ?? 0}`}
					detail="Across Raydium, Orca"
				/>
				<StatusCard
					label="Success Rate"
					value={`${status?.successRate ?? 0}%`}
					detail="Last 24h"
				/>
			</div>

			<div className="mt-6 flex flex-wrap items-center gap-3">
				<StartBotButton />
				<StopBotButton />
				<SimulationToggle />
			</div>

			<div className="mt-6 grid gap-6 xl:grid-cols-2">
				<QuoteCard
					title="USDC → SOL"
					quote={forward}
					inputSymbol="USDC"
					outputSymbol="SOL"
					inputDecimals={6}
					outputDecimals={9}
					loading={quotesLoading}
				/>
				<QuoteCard
					title="SOL → USDC"
					quote={reverse}
					inputSymbol="SOL"
					outputSymbol="USDC"
					inputDecimals={9}
					outputDecimals={6}
					loading={quotesLoading}
				/>
			</div>
			{quotesError ? (
				<p className="mt-3 text-xs text-rose-400">{quotesError}</p>
			) : null}

			<div className="mt-6 grid gap-6 xl:grid-cols-3">
				<div className="xl:col-span-2">
					<ProfitChart data={profitData} />
				</div>
				<div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
					<h3 className="text-sm font-semibold text-white">Bot Status</h3>
					<p className="mt-2 text-3xl font-semibold text-emerald-300">
						{status?.status ?? "unknown"}
					</p>
					<p className="mt-2 text-xs text-slate-400">
						Last heartbeat {status?.lastHeartbeat ?? "--"}
					</p>
					<div className="mt-6 space-y-2 text-xs text-slate-400">
						<p>Scanner: Active</p>
						<p>Strategy Engine: Active</p>
						<p>Execution Queue: 2 pending</p>
					</div>
				</div>
			</div>

			<div className="mt-6 grid gap-6 xl:grid-cols-2">
				<LastTradeCard trade={lastTrade} />
				<StatusCard
					label="Bot Status"
					value={status?.status ?? "unknown"}
					detail={status?.lastHeartbeat ? `Last heartbeat ${status.lastHeartbeat}` : ""}
				/>
			</div>

			<div className="mt-6">
				<OpportunityTable rows={opportunities} />
			</div>
		</DashboardLayout>
	);
}
