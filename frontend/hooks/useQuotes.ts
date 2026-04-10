"use client";

import { useEffect, useState } from "react";
import { fetchReverseQuote, QuoteDetails } from "../lib/quoteEngine";
import { SOLANA_CONFIG_ERROR, USDC_MINT } from "../lib/solanaConfig";

type QuoteState = {
	forward: QuoteDetails | null;
	reverse: QuoteDetails | null;
	loading: boolean;
	error: string | null;
};

const SOL_MINT = "So11111111111111111111111111111111111111112";
const DEFAULT_USDC_AMOUNT = 1_000_000n;

// Load forward and reverse quotes for the USDC/SOL pair.
export function useQuotes(): QuoteState {
	const [state, setState] = useState<QuoteState>({
		forward: null,
		reverse: null,
		loading: true,
		error: null,
	});

	useEffect(() => {
		let active = true;
		let interval: ReturnType<typeof setInterval> | null = null;

		const loadQuotes = async (): Promise<void> => {
			if (SOLANA_CONFIG_ERROR || !USDC_MINT) {
				if (!active) return;
				setState({
					forward: null,
					reverse: null,
					loading: false,
					error: SOLANA_CONFIG_ERROR ?? "Missing NEXT_PUBLIC_USDC_MINT.",
				});
				return;
			}

			try {
				const { forward, reverse } = await fetchReverseQuote(
					USDC_MINT.toBase58(),
					SOL_MINT,
					DEFAULT_USDC_AMOUNT
				);
				if (!active) return;
				setState({ forward, reverse, loading: false, error: null });
			} catch (error) {
				if (!active) return;
				setState({
					forward: null,
					reverse: null,
					loading: false,
					error: (error as Error).message,
				});
			}
		};

		void loadQuotes();
		interval = setInterval(loadQuotes, 15000);

		return () => {
			active = false;
			if (interval) clearInterval(interval);
		};
	}, []);

	return state;
}
