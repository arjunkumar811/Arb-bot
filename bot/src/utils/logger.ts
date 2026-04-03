import fs from "fs";
import path from "path";

export type LogEntry = {
	level: "success" | "failure" | "info";
	message: string;
	profit?: string;
	signature?: string;
	flashLoanAmount?: string;
	swapDetails?: string;
	failureReason?: string;
	timestamp: string;
};

const LOG_FILE =
	process.env.LOG_FILE ?? path.resolve(process.cwd(), "logs", "arb-bot.log");

function ensureLogDir(): void {
	const dir = path.dirname(LOG_FILE);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

function writeLog(entry: LogEntry): void {
	ensureLogDir();
	const line = JSON.stringify(entry);
	fs.appendFileSync(LOG_FILE, `${line}\n`, "utf-8");
}

export function logSuccess(message: string, signature?: string, profit?: string): void {
	writeLog({
		level: "success",
		message,
		signature,
		profit,
		timestamp: new Date().toISOString(),
	});
}

export function logFailure(
	message: string,
	signature?: string,
	failureReason?: string
): void {
	writeLog({
		level: "failure",
		message,
		signature,
		failureReason,
		timestamp: new Date().toISOString(),
	});
}

export function logInfo(message: string): void {
	writeLog({
		level: "info",
		message,
		timestamp: new Date().toISOString(),
	});
}

export function logFlashLoan(amount: bigint, message = "Flash loan"): void {
	writeLog({
		level: "info",
		message,
		flashLoanAmount: amount.toString(),
		timestamp: new Date().toISOString(),
	});
}

export function logSwap(signature: string, details: string): void {
	writeLog({
		level: "info",
		message: "Swap executed",
		signature,
		swapDetails: details,
		timestamp: new Date().toISOString(),
	});
}

export function logProfit(amount: bigint, message = "Profit calculated"): void {
	writeLog({
		level: "info",
		message,
		profit: amount.toString(),
		timestamp: new Date().toISOString(),
	});
}
