import fs from "fs";
import path from "path";
import dotenv from "dotenv";

let loaded = false;

export function loadEnv(): void {
	if (loaded) return;
	loaded = true;

	const candidates = [
		path.resolve(process.cwd(), ".env"),
		path.resolve(process.cwd(), "bot", ".env"),
		path.resolve(__dirname, "..", "..", ".env"),
	];

	for (const candidate of candidates) {
		if (fs.existsSync(candidate)) {
			dotenv.config({ path: candidate });
			return;
		}
	}
	dotenv.config();
}
