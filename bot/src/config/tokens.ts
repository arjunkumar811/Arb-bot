export type TokenConfig = {
	symbol: string;
	mint: string;
	decimals: number;
};

export const TOKENS: Record<string, TokenConfig> = {
	SOL: {
		symbol: "SOL",
		mint: "So11111111111111111111111111111111111111112",
		decimals: 9,
	},
	USDC: {
		symbol: "USDC",
		mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
		decimals: 6,
	},
	USDT: {
		symbol: "USDT",
		mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
		decimals: 6,
	},
	mSOL: {
		symbol: "mSOL",
		mint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
		decimals: 9,
	},
};
