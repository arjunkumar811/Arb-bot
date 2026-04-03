export type SwapRouteBatch = {
	routes: unknown[];
};

export function buildSwapBatch(...routes: unknown[]): SwapRouteBatch {
	return { routes };
}
