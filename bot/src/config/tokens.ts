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
		mint: "EPjFWdd5AufqSSqeM2q8kP9Rwx8wZMBZ9K9J8sWq5uV",
		decimals: 6,
	},
	USDT: {
		symbol: "USDT",
		mint: "Es9vMFrzaCERp8hZpC1ZK4n5Vf3L7h4r9JQq9VHtV",
		decimals: 6,
	},
	mSOL: {
		symbol: "mSOL",
		mint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
		decimals: 9,
	},
};
