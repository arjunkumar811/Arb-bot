import { runBot } from "./bot/main";

runBot().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
