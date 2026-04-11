"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { DashboardLayout } from "../../components/layout";
import { DashboardCard } from "../../components/dashboard/DashboardCard";
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
	const [execution, setExecution] = useState<ExecutionUpdate | null>(null);
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
	const [executionLatency, setExecutionLatency] = useState<number | null>(null);
	const [profitStats, setProfitStats] = useState<ProfitStats>({
		totalTrades: 0,
		successfulTrades: 0,
		failedTrades: 0,
		totalProfit: 0,
		history: [],
	});
	const [simulation, setSimulation] = useState(false);
	const logRef = useRef<HTMLDivElement | null>(null);
	const logEndRef = useRef<HTMLDivElement | null>(null);
	const autoScrollRef = useRef(true);

	useEffect(() => {
		const socket = getSocket();

		socket.on("wallet_update", (payload: WalletUpdate) => setWallet(payload));
		socket.on("quote_update", (payload: QuoteUpdate) => setQuote(payload));
		socket.on("arb_update", (payload: ArbUpdate) => setArb(payload));
		socket.on("execution_update", (payload: ExecutionUpdate) => {
			if (payload.step === "fetch_quotes" && payload.status === "running") {
				setFailedStep(null);
			}
			setExecution(payload);
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
		socket.on("execution_latency_update", (payload: ExecutionLatencyUpdate) => {
			setExecutionLatency(payload.totalExecutionTime);
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

	useEffect(() => {
		if (!autoScrollRef.current) return;
		const container = logRef.current;
		if (!container) return;
		requestAnimationFrame(() => {
			container.scrollTop = container.scrollHeight;
		});
	}, [logs]);

	const stats = useMemo(() => {
		return {
			totalTrades: profitStats.totalTrades,
			successfulTrades: profitStats.successfulTrades,
			failedTrades: profitStats.failedTrades,
			totalProfit: profitStats.totalProfit,
		};
	}, [profitStats]);

	return (
		<DashboardLayout
			title="Dashboard"
			subtitle="Real-time Solana flash loan activity"
		>
			<div className="space-y-6">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<h2 className="text-lg font-semibold">Arbitrage Dashboard</h2>
						<p className="text-xs text-slate-400">
							Streaming wallet, quote, and execution events
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<button
							onClick={() => {
								const socket = getSocket();
								socket.emit("start_bot");
							}}
							className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200"
						>
							Start Scanner
						</button>
						<button
							onClick={() => {
								const socket = getSocket();
								socket.emit("execute_single");
							}}
							className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200"
						>
							Execute Single Trade
						</button>
						<button
							onClick={() => {
								const socket = getSocket();
								socket.emit("stop_bot");
							}}
							className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200"
						>
							Stop Bot
						</button>
						<button
							onClick={() => {
								const socket = getSocket();
								socket.emit("simulation_toggle", { enabled: !simulation });
							}}
							className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200"
						>
							Simulation: {simulation ? "ON" : "OFF"}
						</button>
					</div>
				</div>

				<div className="grid gap-6 lg:grid-cols-3">
					<DashboardCard title="Wallet Status" subtitle="Balances">
						<div className="space-y-2 text-sm">
							<p>SOL: {wallet?.solBalance?.toFixed(3) ?? "--"}</p>
							<p>USDC: {wallet?.usdcBalance ?? "--"}</p>
							<p>USDT: {wallet?.usdtBalance ?? "--"}</p>
						</div>
					</DashboardCard>
					<DashboardCard title="Live Quotes" subtitle="Jupiter route">
						<div className="space-y-2 text-sm">
							<p>
								{quote?.inputToken ?? "--"} → {quote?.outputToken ?? "--"}
							</p>
							<p>Input: {quote?.inputAmount ?? "--"}</p>
							<p>Output: {quote?.outputAmount ?? "--"}</p>
							<p>Route: {quote?.route ?? "--"}</p>
						</div>
					</DashboardCard>
					<DashboardCard title="Arbitrage Scanner" subtitle="Opportunity">
						<div className="space-y-2 text-sm">
							<p>Profit: {arb?.profit ?? "--"}</p>
							<p>Profitable: {arb?.profitable ? "Yes" : "No"}</p>
							<p>Percent: {arb?.percentage?.toFixed(2) ?? "--"}%</p>
						</div>
					</DashboardCard>
				</div>

				<div className="grid gap-6 lg:grid-cols-2">
					<DashboardCard title="System Health" subtitle="RPC Monitor">
						<div className="space-y-2 text-sm">
							<p>Status: {rpcHealth?.status ?? "--"}</p>
							<p>Latency: {rpcHealth?.latencyMs ?? "--"}ms</p>
							<p>Block Height: {rpcHealth?.blockHeight ?? "--"}</p>
						</div>
					</DashboardCard>
					<DashboardCard title="Profit Validation" subtitle="Execution checks">
						<div className="space-y-2 text-sm">
							<p>Expected Profit: {profitValidation?.expectedProfit ?? "--"}</p>
							<p>Actual Profit: {profitValidation?.actualProfit ?? "--"}</p>
							<p>Fees: {profitValidation?.fees ?? "--"}</p>
							<p>Net Profit: {profitValidation?.netProfit ?? "--"}</p>
							{profitValidationFailed ? (
								<p className="text-rose-400">
									Validation Failed
								</p>
							) : null}
						</div>
					</DashboardCard>
				</div>

				<div className="grid gap-6 lg:grid-cols-3">
					<DashboardCard title="Execution Status" subtitle="Flash loan flow">
						<div className="space-y-3">
							<div className="flex flex-wrap items-center justify-between text-xs text-slate-400">
								<span>Queue: {queueSize} pending</span>
								<span>{executing ? "Executing" : "Idle"}</span>
								<span>
									Total: {executionLatency ?? "--"}ms
								</span>
							</div>
							{failedStep ? (
								<div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-2 text-xs text-rose-300">
									<p>Failed Step: {failedStep.step}</p>
									<p className="truncate">{failedStep.error}</p>
									<button
										onClick={() => {
											const socket = getSocket();
											socket.emit("execute_single");
										}}
										className="mt-2 rounded border border-rose-400/60 px-2 py-1 text-[11px] font-semibold text-rose-200"
									>
										Retry
									</button>
								</div>
							) : null}
							<div className="h-2 w-full rounded-full bg-slate-800">
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
							<div className="space-y-2">
								{[
									{ key: "fetch_quotes", title: "Fetch Quotes" },
									{ key: "detect_arb", title: "Detect Arbitrage" },
									{ key: "borrow", title: "Borrow Flash Loan" },
									{ key: "swap1", title: "Swap Token A → B" },
									{ key: "swap2", title: "Swap Token B → C" },
									{ key: "repay", title: "Repay Loan" },
									{ key: "confirmed", title: "Confirm Transaction" },
									{ key: "profit", title: "Update Profit" },
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
					</DashboardCard>
					<DashboardCard title="Profit Analytics" subtitle="Last 50 trades">
						<div className="h-48">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart data={profitStats.history}>
									<CartesianGrid stroke="#1e293b" strokeDasharray="4 4" />
									<XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
									<YAxis stroke="#94a3b8" fontSize={10} />
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
						<div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-400">
							<p>Total Trades: {stats.totalTrades}</p>
							<p>Successful: {stats.successfulTrades}</p>
							<p>Failed: {stats.failedTrades}</p>
							<p>Total Profit: {stats.totalProfit.toFixed(0)}</p>
							<p>Daily Profit: {profitStats.dailyProfit?.toFixed(0) ?? "--"}</p>
						</div>
					</DashboardCard>
					<DashboardCard title="Logs Console" subtitle="Live feed">
						<div
							ref={logRef}
							onScroll={() => {
								const container = logRef.current;
								if (!container) return;
								const distanceFromBottom =
									container.scrollHeight -
									container.scrollTop -
									container.clientHeight;
								autoScrollRef.current = distanceFromBottom < 48;
							}}
							className="h-48 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-slate-300"
						>
							{logs.length === 0 ? (
								<p className="text-slate-500">Waiting for log events...</p>
							) : (
								logs.map((log, index) => (
									<p
										key={`${log.timestamp}-${index}`}
										className={
											index % 2 === 0
												? "text-slate-300"
												: "text-slate-400"
										}
									>
										[{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
									</p>
								))
							)}
							<div ref={logEndRef} />
						</div>
					</DashboardCard>
				</div>
			</div>
		</DashboardLayout>
	);
}
