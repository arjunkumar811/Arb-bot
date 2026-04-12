"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "../../components/layout";
import { LogsConsole } from "../../components/dashboard/LogsConsole";
import { ProfitChart } from "../../components/dashboard/ProfitChart";
import { StatusBadge } from "../../components/dashboard/StatusBadge";
import { StatsCard } from "../../components/dashboard/StatsCard";
import { WalletCard } from "../../components/dashboard/WalletCard";
import { ExecutionStep, StepStatus } from "../../components/ExecutionStep";
import { getSocket } from "../../lib/socket";

type WalletUpdate = {
	solBalance: number;
	usdcBalance: string;
	usdtBalance: string;
};

type QuoteUpdate = {
	inputToken: string;
	outputToken: string;
	inputAmount: string;
	outputAmount: string;
	route: string;
	fee: string;
};

type ArbUpdate = {
	startAmount: string;
	finalAmount: string;
	profit: string;
	percentage: number;
	profitable: boolean;
};

type ExecutionUpdate = {
	step: string;
	status?: StepStatus;
	timestamp?: string;
	transactionSignature?: string;
};

type StepDurationUpdate = {
	step: string;
	durationMs: number;
};

type ExecutionFailedUpdate = {
	step: string;
	error: string;
};

type RpcHealthUpdate = {
	latencyMs: number;
	blockHeight: number;
	status: "OK" | "FAILED";
};

type ProfitUpdatePayload = {
	expectedProfit: string;
	actualProfit: string;
	fees: string;
	netProfit: string;
};

type ProfitStatsUpdate = {
	totalTrades: number;
	successCount?: number;
	failCount?: number;
	successfulTrades?: number;
	failedTrades?: number;
	totalProfit: number;
	dailyProfit?: number;
	history: ProfitPoint[];
};

type ExecutionQueueUpdate = {
	queueSize: number;
};

type ExecutionStateUpdate = {
	executing: boolean;
};

type ExecutionLatencyUpdate = {
	totalExecutionTime: number;
};

type ProfitValidationFailed = {
	expectedProfit: string;
	fees: string;
	netProfit: string;
};

type LogUpdate = {
	message: string;
	timestamp: string;
};

type ProfitPoint = {
	time: string;
	profit: number;
};

type ProfitStats = {
	totalTrades: number;
	successfulTrades: number;
	failedTrades: number;
	totalProfit: number;
	dailyProfit?: number;
	history: ProfitPoint[];
};

type SimulationUpdate = {
	enabled: boolean;
};

export default function DashboardPage(): JSX.Element {
	const [wallet, setWallet] = useState<WalletUpdate | null>(null);
	const [quote, setQuote] = useState<QuoteUpdate | null>(null);
	const [arb, setArb] = useState<ArbUpdate | null>(null);
	const [logs, setLogs] = useState<LogUpdate[]>([]);
	const [stepState, setStepState] = useState<Record<string, ExecutionUpdate>>(
		{}
	);
	const [stepDurations, setStepDurations] = useState<Record<string, number>>(
		{}
	);
	const [failedStep, setFailedStep] = useState<ExecutionFailedUpdate | null>(
		null
	);
	const [rpcHealth, setRpcHealth] = useState<RpcHealthUpdate | null>(null);
	const [profitValidation, setProfitValidation] =
		useState<ProfitUpdatePayload | null>(null);
	const [profitValidationFailed, setProfitValidationFailed] =
		useState<ProfitValidationFailed | null>(null);
	const [queueSize, setQueueSize] = useState(0);
	const [executing, setExecuting] = useState(false);
	const [profitStats, setProfitStats] = useState<ProfitStats>({
		totalTrades: 0,
		successfulTrades: 0,
		failedTrades: 0,
		totalProfit: 0,
		history: [],
	});
	const [simulation, setSimulation] = useState(false);

	useEffect(() => {
		const socket = getSocket();

		socket.on("wallet_update", (payload: WalletUpdate) => setWallet(payload));
		socket.on("quote_update", (payload: QuoteUpdate) => setQuote(payload));
		socket.on("arb_update", (payload: ArbUpdate) => setArb(payload));
		socket.on("execution_update", (payload: ExecutionUpdate) => {
			if (payload.step === "fetch_quotes" && payload.status === "running") {
				setFailedStep(null);
			}
			setStepState((prev) => ({
				...prev,
				[payload.step]: payload,
			}));
			setLogs((prev) => [
				...prev.slice(-200),
				{
					message: `${payload.step} ${payload.status ?? "running"}`,
					timestamp: payload.timestamp ?? new Date().toISOString(),
				},
			]);
		});
		socket.on("step_duration_update", (payload: StepDurationUpdate) => {
			setStepDurations((prev) => ({
				...prev,
				[payload.step]: payload.durationMs,
			}));
		});
		socket.on("execution_failed", (payload: ExecutionFailedUpdate) => {
			setFailedStep(payload);
			setLogs((prev) => [
				...prev.slice(-200),
				{
					message: `Failed Step: ${payload.step} - ${payload.error}`,
					timestamp: new Date().toISOString(),
				},
			]);
		});
		socket.on("rpc_health_update", (payload: RpcHealthUpdate) => {
			setRpcHealth(payload);
		});
		socket.on("profit_update", (payload: ProfitUpdatePayload) => {
			setProfitValidation(payload);
			setProfitValidationFailed(null);
		});
		socket.on(
			"profit_validation_failed",
			(payload: ProfitValidationFailed) => {
				setProfitValidationFailed(payload);
			}
		);
		socket.on("execution_queue_update", (payload: ExecutionQueueUpdate) => {
			setQueueSize(payload.queueSize);
		});
		socket.on("execution_state", (payload: ExecutionStateUpdate) => {
			setExecuting(payload.executing);
		});
		socket.on("execution_latency_update", (_payload: ExecutionLatencyUpdate) => {
			// Intentionally ignored in the new layout.
		});
		socket.on("log_update", (payload: LogUpdate) => {
			setLogs((prev) => [...prev.slice(-200), payload]);
		});
		socket.on("profit_stats_update", (payload: ProfitStatsUpdate) => {
			setProfitStats({
				totalTrades: payload.totalTrades,
				successfulTrades:
					payload.successfulTrades ?? payload.successCount ?? 0,
				failedTrades: payload.failedTrades ?? payload.failCount ?? 0,
				totalProfit: payload.totalProfit,
				dailyProfit: payload.dailyProfit,
				history: payload.history ?? [],
			});
		});
		socket.on("simulation_update", (payload: SimulationUpdate) => {
			setSimulation(Boolean(payload?.enabled));
		});

		return () => {
			socket.off("wallet_update");
			socket.off("quote_update");
			socket.off("arb_update");
			socket.off("execution_update");
				socket.off("step_duration_update");
				socket.off("execution_failed");
				socket.off("rpc_health_update");
				socket.off("profit_update");
				socket.off("profit_validation_failed");
				socket.off("execution_queue_update");
				socket.off("execution_state");
				socket.off("execution_latency_update");
			socket.off("log_update");
				socket.off("profit_stats_update");
			socket.off("simulation_update");
		};
	}, []);

	const stats = useMemo(() => {
		return {
			totalTrades: profitStats.totalTrades,
			successfulTrades: profitStats.successfulTrades,
			failedTrades: profitStats.failedTrades,
			totalProfit: profitStats.totalProfit,
		};
	}, [profitStats]);

	const botStatus = useMemo<
		"running" | "stopped" | "simulation" | "error"
	>(() => {
		if (failedStep) return "error";
		if (simulation) return "simulation";
		if (executing) return "running";
		return "stopped";
	}, [executing, failedStep, simulation]);

	return (
		<DashboardLayout
			title="Dashboard"
			subtitle="Real-time Solana flash loan activity"
			botStatus={botStatus}
		>
			<div className="space-y-6">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<h2 className="text-2xl font-semibold text-white">Arbitrage Dashboard</h2>
						<p className="text-sm text-slate-400">
							Streaming wallet, quote, and execution events
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<button
							onClick={() => {
								const socket = getSocket();
								socket.emit("start_bot");
							}}
							className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-500/20 transition-all duration-200 hover:bg-sky-500"
						>
							Start Scanner
						</button>
						<button
							onClick={() => {
								const socket = getSocket();
								socket.emit("execute_single");
							}}
							className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-4 py-2 text-xs font-semibold text-slate-100 transition-all duration-200 hover:bg-slate-800"
						>
							Execute Single Trade
						</button>
						<button
							onClick={() => {
								const socket = getSocket();
								socket.emit("stop_bot");
							}}
							className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-500/20 transition-all duration-200 hover:bg-rose-500"
						>
							Stop Bot
						</button>
						<button
							onClick={() => {
								const socket = getSocket();
								socket.emit("simulation_toggle", { enabled: !simulation });
							}}
							className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-200 transition-all duration-200 hover:bg-amber-500/20"
						>
							Simulation: {simulation ? "ON" : "OFF"}
						</button>
					</div>
				</div>

				<div className="grid grid-cols-12 gap-4">
					<div className="col-span-12 space-y-4 lg:col-span-3">
						<WalletCard
							address={wallet?.solBalance !== undefined ? "Wallet connected" : null}
							solBalance={wallet?.solBalance ?? null}
							usdcBalance={wallet?.usdcBalance ?? null}
							statusLabel={executing ? "Scanning in progress" : "Idle"}
						/>
						<div className="rounded-xl border border-slate-700/80 bg-slate-800/70 p-4 shadow-md">
							<p className="text-xs uppercase tracking-widest text-slate-400">Bot Status</p>
							<div className="mt-3 flex items-center justify-between">
								<StatusBadge
									status={botStatus}
									label={
										botStatus === "running"
											? "Running"
											: botStatus === "simulation"
											? "Simulation"
											: botStatus === "error"
											? "Error"
											: "Stopped"
									}
								/>
								<span className="text-xs text-slate-400">
									Queue: {queueSize}
								</span>
							</div>
							<div className="mt-4 space-y-2 text-sm text-slate-200">
								<p>Latency: {rpcHealth?.latencyMs ?? "--"}ms</p>
								<p>Block Height: {rpcHealth?.blockHeight ?? "--"}</p>
							</div>
						</div>
						<div className="rounded-xl border border-slate-700/80 bg-slate-800/70 p-4 shadow-md">
							<p className="text-xs uppercase tracking-widest text-slate-400">Live Quotes</p>
							<div className="mt-3 space-y-2 text-sm text-slate-200">
								<p>
									{quote?.inputToken ?? "--"} → {quote?.outputToken ?? "--"}
								</p>
								<p>Input: {quote?.inputAmount ?? "--"}</p>
								<p>Output: {quote?.outputAmount ?? "--"}</p>
								<p className="text-xs text-slate-400">
									Route: {quote?.route ?? "--"}
								</p>
							</div>
						</div>
					</div>

					<div className="col-span-12 space-y-4 lg:col-span-6">
						<ProfitChart data={profitStats.history} />
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<StatsCard
								label="Total Trades"
								value={stats.totalTrades.toString()}
								hint={stats.totalTrades === 0 ? "Waiting for trades..." : undefined}
							/>
							<StatsCard
								label="Total Profit"
								value={stats.totalProfit.toFixed(0)}
								hint="Net PnL"
							/>
							<StatsCard
								label="Successful"
								value={stats.successfulTrades.toString()}
								hint="Profitable trades"
							/>
							<StatsCard
								label="Failed"
								value={stats.failedTrades.toString()}
								hint="Unprofitable trades"
							/>
						</div>
						<div className="rounded-xl border border-slate-700/80 bg-slate-800/70 p-4 shadow-md">
							<p className="text-xs uppercase tracking-widest text-slate-400">Execution Flow</p>
							<div className="mt-4 space-y-2">
								{failedStep ? (
									<div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-2 text-xs text-rose-300">
										<p>Failed Step: {failedStep.step}</p>
										<p className="truncate">{failedStep.error}</p>
									</div>
								) : null}
								<div className="h-2 w-full rounded-full bg-slate-900">
									<div
										className="h-2 rounded-full bg-emerald-500"
										style={{
											width: `${
												(Math.min(
													Object.values(stepState).filter(
														(step) => step.status === "success"
													).length,
													8
												) /
													8) * 100
										}%`,
										}}
									/>
								</div>
								<div className="mt-4 space-y-2">
									{[
										{ key: "fetch_quotes", title: "Fetch Quotes" },
										{ key: "detect_arb", title: "Detect Arbitrage" },
										{ key: "borrow", title: "Borrow Flash Loan" },
										{ key: "swap1", title: "Swap Token A → B" },
										{ key: "swap2", title: "Swap Token B → C" },
										{ key: "repay", title: "Repay Loan" },
										{ key: "confirmed", title: "Confirm Transaction" },
									].map((step, index) => (
										<ExecutionStep
											key={step.key}
											index={index + 1}
											title={step.title}
											status={
												stepState[step.key]?.status ?? "pending"
											}
											timestamp={stepState[step.key]?.timestamp}
											signature={stepState[step.key]?.transactionSignature}
											durationMs={stepDurations[step.key]}
										/>
									))}
								</div>
							</div>
						</div>
					</div>

					<div className="col-span-12 space-y-4 lg:col-span-3">
						<div className="rounded-xl border border-slate-700/80 bg-slate-800/70 p-4 shadow-md">
							<p className="text-xs uppercase tracking-widest text-slate-400">Performance</p>
							<div className="mt-3 space-y-2 text-sm text-slate-200">
								<p>Expected Profit: {profitValidation?.expectedProfit ?? "--"}</p>
								<p>Actual Profit: {profitValidation?.actualProfit ?? "--"}</p>
								<p>Fees: {profitValidation?.fees ?? "--"}</p>
								<p>Net Profit: {profitValidation?.netProfit ?? "--"}</p>
								{profitValidationFailed ? (
									<p className="text-xs text-rose-400">Validation Failed</p>
								) : null}
							</div>
						</div>
						<div className="rounded-xl border border-slate-700/80 bg-slate-800/70 p-4 shadow-md">
							<p className="text-xs uppercase tracking-widest text-slate-400">Logs Console</p>
							<div className="mt-3">
								<LogsConsole logs={logs} />
							</div>
						</div>
					</div>
				</div>
			</div>
		</DashboardLayout>
	);
}
