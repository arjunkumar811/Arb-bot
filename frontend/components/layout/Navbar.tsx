"use client";

import { WalletStatus } from "../wallet";
import { StatusBadge } from "../dashboard/StatusBadge";

type NavbarProps = {
	botStatus: "running" | "stopped" | "simulation" | "error";
};

export function Navbar({ botStatus }: NavbarProps): JSX.Element {
	const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? "";
	const networkLabel = rpcUrl.includes("devnet") ? "Devnet" : "Mainnet";

	return (
		<header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/80 px-6 py-4 backdrop-blur">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300 shadow-[0_0_24px_rgba(56,189,248,0.25)]">
						<span className="text-lg font-semibold">FL</span>
					</div>
					<div>
						<p className="text-lg font-semibold text-white">Flash Loan Arb</p>
						<p className="text-xs text-slate-400">Professional trading console</p>
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<span className="rounded-full border border-slate-700/70 bg-slate-900/80 px-3 py-1 text-xs text-slate-300">
						Network: {networkLabel}
					</span>
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
					<WalletStatus compact />
				</div>
			</div>
		</header>
	);
}
