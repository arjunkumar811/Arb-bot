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
		mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
		decimals: 6,
	},
	USDT: {
		symbol: "USDT",
		mint: "Es9vMFrzaCERmJfrF4H2FYD4KJ7a1T1gWQn2qH6sV9e",
		decimals: 6,
	},
};
