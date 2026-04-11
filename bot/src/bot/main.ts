import { startBot } from "./bot";
import { testJupiterConnection } from "../dex/jupiterClient";
import { logInfo } from "../utils/logger";

export async function runBot(): Promise<void> {
	const major = Number(process.versions.node.split(".")[0] ?? 0);
	if (major < 18) {
		console.warn("Node.js 18+ required for fetch()");
		logInfo("Node.js 18+ required for fetch()");
	}
	await testJupiterConnection();
	await startBot();
}
