import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { QuoteDetails } from "../../lib/quoteEngine";

type QuoteCardProps = {
	title: string;
	quote: QuoteDetails | null;
	inputSymbol: string;
	outputSymbol: string;
	inputDecimals: number;
	outputDecimals: number;
	loading?: boolean;
};

// Format a raw token amount into a display string with decimals.
function formatTokenAmount(raw: string, decimals: number): string {
	if (!raw) return "--";
	try {
		const value = BigInt(raw);
		const base = 10n ** BigInt(decimals);
		const whole = value / base;
		const fraction = value % base;
		const fractionText = fraction.toString().padStart(decimals, "0").slice(0, 4);
		return `${whole.toString()}.${fractionText}`;
	} catch {
		return "--";
	}
}

// Render a single Jupiter quote summary card.
export function QuoteCard({
	title,
	quote,
	inputSymbol,
	outputSymbol,
	inputDecimals,
	outputDecimals,
	loading,
}: QuoteCardProps): JSX.Element {
	const route = quote?.bestRoute ?? "--";
	const expectedOutput = quote
		? `${formatTokenAmount(quote.route.outAmount, outputDecimals)} ${outputSymbol}`
		: "--";
	const fees = quote
		? `${formatTokenAmount(quote.feeAmount, outputDecimals)} ${outputSymbol}`
		: "--";

	return (
		<Card className="bg-slate-900/70 shadow-lg">
			<CardHeader>
				<CardTitle className="text-sm">{title}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3 pt-0 text-xs text-slate-300">
				<div className="flex items-center justify-between">
					<span className="text-slate-500">Best route</span>
					<span className="text-right text-slate-200">{route}</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-slate-500">Expected output</span>
					<span className="text-right text-emerald-300">{expectedOutput}</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-slate-500">Fees</span>
					<span className="text-right text-slate-200">{fees}</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-slate-500">Input</span>
					<span className="text-right text-slate-200">
						{quote
							? `${formatTokenAmount(quote.route.inAmount, inputDecimals)} ${inputSymbol}`
							: "--"}
					</span>
				</div>
				{loading ? (
					<div className="text-xs text-slate-400">Loading quotes…</div>
				) : null}
			</CardContent>
		</Card>
	);
}
