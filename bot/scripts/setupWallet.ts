import {
	Connection,
	Keypair,
	LAMPORTS_PER_SOL,
	PublicKey,
	sendAndConfirmTransaction,
	Transaction,
} from "@solana/web3.js";
import {
	createAssociatedTokenAccountInstruction,
	getAssociatedTokenAddress,
} from "@solana/spl-token";
import fs from "fs";
import path from "path";

const USDC_MINT = "EPjFWdd5AufqSSqeM2q8kP9Rwx8wZMBZ9K9J8sWq5uV";
const USDT_MINT = "Es9vMFrzaCERp8hZpC1ZK4n5Vf3L7h4r9JQq9VHtV";

const envPath = path.resolve(process.cwd(), ".env");

type EnvMap = Record<string, string>;

function logLine(message: string): void {
	const logFile = process.env.LOG_FILE ?? path.resolve(process.cwd(), "logs", "arb-bot.log");
	const dir = path.dirname(logFile);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
	fs.appendFileSync(
		logFile,
		`${new Date().toISOString()} ${message}\n`,
		"utf-8"
	);
}

function loadEnvFile(): EnvMap {
	if (!fs.existsSync(envPath)) {
		throw new Error(`.env not found at ${envPath}`);
	}

	const raw = fs.readFileSync(envPath, "utf-8");
	const map: EnvMap = {};

	for (const line of raw.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const idx = trimmed.indexOf("=");
		if (idx === -1) continue;
		const key = trimmed.slice(0, idx).trim();
		const value = trimmed.slice(idx + 1).trim();
		if (key) map[key] = value;
	}

	return map;
}

function applyEnv(vars: EnvMap): void {
	for (const [key, value] of Object.entries(vars)) {
		if (!process.env[key]) {
			process.env[key] = value;
		}
	}
}

function requireEnv(value: string | undefined, label: string): string {
	if (!value) {
		throw new Error(`${label} is not set in .env`);
	}
	return value;
}

function updateEnvValue(key: string, value: string, lines: string[]): string[] {
	let updated = false;
	const next = lines.map((line) => {
		if (!line.trim().startsWith(`${key}=`)) return line;
		updated = true;
		return `${key}=${value}`;
	});

	if (!updated) {
		next.push(`${key}=${value}`);
	}

	return next;
}

function writeEnvFile(updates: EnvMap): void {
	const raw = fs.readFileSync(envPath, "utf-8");
	let lines = raw.split(/\r?\n/);

	for (const [key, value] of Object.entries(updates)) {
		lines = updateEnvValue(key, value, lines);
	}

	fs.writeFileSync(envPath, lines.join("\n"), "utf-8");
}

function loadKeypair(filePath: string): Keypair {
	const raw = fs.readFileSync(filePath, "utf-8");
	const secretKey = Uint8Array.from(JSON.parse(raw));
	return Keypair.fromSecretKey(secretKey);
}

function validatePublicKey(label: string, value: string): void {
	try {
		void new PublicKey(value);
	} catch (error) {
		throw new Error(`${label} is not a valid public key: ${value}`);
	}
}

async function getOrCreateTokenAccount(
	connection: Connection,
	wallet: Keypair,
	mintAddress: string
): Promise<PublicKey> {
	const mint = new PublicKey(mintAddress);
	const ata = await getAssociatedTokenAddress(mint, wallet.publicKey, false);
	const accountInfo = await connection.getAccountInfo(ata);

	if (accountInfo) {
		console.log(`Token account exists: ${ata.toBase58()}`);
		return ata;
	}

	const instruction = createAssociatedTokenAccountInstruction(
		wallet.publicKey,
		ata,
		wallet.publicKey,
		mint
	);

	const transaction = new Transaction().add(instruction);
	await sendAndConfirmTransaction(connection, transaction, [wallet]);

	console.log(`Created token account: ${ata.toBase58()}`);
	return ata;
}

async function main(): Promise<void> {
	const env = loadEnvFile();
	applyEnv(env);

	const rpcUrl = requireEnv(process.env.RPC_URL, "RPC_URL");
	const keypairPath = requireEnv(process.env.KEYPAIR_PATH, "KEYPAIR_PATH");
	const resolvedKeypairPath = path.resolve(process.cwd(), keypairPath);

	const connection = new Connection(rpcUrl, "confirmed");
	const wallet = loadKeypair(resolvedKeypairPath);

	const walletAddress = wallet.publicKey.toBase58();
	console.log(`Wallet Address: ${walletAddress}`);
	logLine("Wallet loaded");

	const balance = await connection.getBalance(wallet.publicKey);
	if (balance < 0.05 * LAMPORTS_PER_SOL) {
		console.warn("Low SOL balance — please fund wallet before running bot.");
	}

	validatePublicKey("USDC mint", USDC_MINT);
	validatePublicKey("USDT mint", USDT_MINT);

	const usdcAccount = await getOrCreateTokenAccount(
		connection,
		wallet,
		USDC_MINT
	);
	const usdtAccount = await getOrCreateTokenAccount(
		connection,
		wallet,
		USDT_MINT
	);

	console.log(`USDC Token Account: ${usdcAccount.toBase58()}`);
	console.log(`USDT Token Account: ${usdtAccount.toBase58()}`);

	writeEnvFile({
		INPUT_TOKEN_ACCOUNT: usdcAccount.toBase58(),
		OUTPUT_TOKEN_ACCOUNT: usdtAccount.toBase58(),
	});
	logLine("Token accounts verified");
	logLine(".env updated");

	console.log("\nSetup complete.");
}

main().catch((error) => {
	console.error("Setup failed:", error);
	process.exit(1);
});
