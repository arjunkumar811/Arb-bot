import Link from "next/link";

export default function HomePage(): JSX.Element {
	return (
		<div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
			<div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-10 text-center shadow-xl">
				<h1 className="text-2xl font-semibold">Flash Loan Arb</h1>
				<p className="mt-2 text-sm text-slate-400">
					Professional Solana arbitrage dashboard
				</p>
				<Link
					href="/dashboard"
					className="mt-6 inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400"
				>
					Go to Dashboard
				</Link>
			</div>
		</div>
	);
}
