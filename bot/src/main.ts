import { loadEnv } from "./config/loadEnv";
import { runBot } from "./bot/main";

loadEnv();

runBot().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
