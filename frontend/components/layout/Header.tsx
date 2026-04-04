type HeaderProps = {
	title: string;
	subtitle?: string;
};

export function Header({ title, subtitle }: HeaderProps): JSX.Element {
	return (
		<header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-slate-950/70 px-8 py-5">
			<div>
				<h1 className="text-xl font-semibold text-white">{title}</h1>
				{subtitle ? (
					<p className="text-sm text-slate-400">{subtitle}</p>
				) : null}
			</div>
			<div className="flex items-center gap-3">
				<button className="rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-200 transition hover:border-emerald-500/40 hover:text-white">
					Connect Wallet
				</button>
				<div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
					Bot: Stopped
				</div>
			</div>
		</header>
	);
}
