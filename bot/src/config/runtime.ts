import fs from "fs";
import path from "path";

export type RuntimeSettings = {
	wallet?: string;
	inputTokenAccount?: string;
	outputTokenAccount?: string;
	updatedAt?: string;
};

const RUNTIME_SETTINGS_PATH =
	process.env.RUNTIME_SETTINGS_PATH ??
	path.resolve(process.cwd(), "runtime-settings.json");

export function readRuntimeSettings(): RuntimeSettings {
	if (!fs.existsSync(RUNTIME_SETTINGS_PATH)) return {};

	try {
		const raw = fs.readFileSync(RUNTIME_SETTINGS_PATH, "utf-8");
		return JSON.parse(raw) as RuntimeSettings;
	} catch {
		return {};
	}
}

export function writeRuntimeSettings(settings: RuntimeSettings): void {
	const payload = {
		...settings,
		updatedAt: new Date().toISOString(),
	};
	fs.writeFileSync(
		RUNTIME_SETTINGS_PATH,
		JSON.stringify(payload, null, 2),
		"utf-8"
	);
}
