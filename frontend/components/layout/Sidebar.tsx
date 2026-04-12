import Link from "next/link";

const navItems = [
	{ label: "Dashboard", href: "/dashboard" },
	{ label: "Trades", href: "/trades" },
	{ label: "Settings", href: "/settings" },
];

export function Sidebar(): JSX.Element {
	return (
		<aside className="hidden min-h-screen w-64 shrink-0 flex-col border-r border-slate-800/80 bg-slate-950/90 lg:flex">
			<div className="flex items-center gap-3 border-b border-slate-800/80 px-6 py-5">
				<div className="h-9 w-9 rounded-xl bg-sky-500/15 text-sky-300 shadow-[0_0_18px_rgba(56,189,248,0.25)]" />
				<div>
					<p className="text-sm font-semibold text-white">Flash Loan Arb</p>
					<p className="text-[11px] text-slate-500">Trading Console</p>
				</div>
			</div>
			<nav className="flex-1 px-4 py-6">
				<div className="text-xs uppercase tracking-wide text-slate-500">
					Main
				</div>
				<ul className="mt-4 space-y-1">
					{navItems.map((item) => (
						<li key={item.href}>
							<Link
								href={item.href}
								className="block rounded-xl px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800/80 hover:text-white"
							>
								{item.label}
							</Link>
						</li>
					))}
				</ul>
			</nav>
			<div className="border-t border-slate-800/80 px-6 py-4 text-xs text-slate-500">
				Connected: Devnet
			</div>
		</aside>
	);
}
