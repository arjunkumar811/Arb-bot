import { buildDualRoute } from "../dex/routeBuilder";

export type ScanPair = {
	baseMint: string;
	quoteMint: string;
	amount: bigint;
};

export type ScanResult = {
	forward: Awaited<ReturnType<typeof buildDualRoute>>["forward"];
	backward: Awaited<ReturnType<typeof buildDualRoute>>["backward"];
	initialAmount: bigint;
	finalAmount: bigint;
};

export async function scanPair(pair: ScanPair): Promise<ScanResult> {
	const { forward, backward } = await buildDualRoute(
		pair.baseMint,
		pair.quoteMint,
		pair.amount
	);

	return {
		forward,
		backward,
		initialAmount: pair.amount,
		finalAmount: backward.outAmount,
	};
}

export async function scanPairs(pairs: ScanPair[]): Promise<ScanResult[]> {
	return Promise.all(pairs.map((pair) => scanPair(pair)));
}
