type WalletCardProps = {
	address?: string | null;
	solBalance?: number | null;
	usdcBalance?: string | null;
	statusLabel: string;
};

export function WalletCard({
	address,
	solBalance,
	usdcBalance,
	statusLabel,
}: WalletCardProps): JSX.Element {
	return (
		<div className="rounded-xl border border-slate-700/80 bg-slate-800/70 p-4 shadow-md">
			<p className="text-xs uppercase tracking-widest text-slate-400">Wallet</p>
			<p className="mt-2 truncate text-sm text-slate-200">
				{address ?? "Not connected"}
			</p>
			<div className="mt-4 space-y-2 text-sm text-slate-200">
				<div className="flex items-center justify-between">
					<span className="text-slate-400">SOL</span>
					<span>{solBalance?.toFixed(3) ?? "--"}</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-slate-400">USDC</span>
					<span>{usdcBalance ?? "--"}</span>
				</div>
			</div>
			<div className="mt-4 text-xs text-slate-400">{statusLabel}</div>
		</div>
	);
}
