import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";
import fs from "fs";
import path from "path";

const DEFAULT_RPC_URL = clusterApiUrl("devnet");

if (!process.env.RPC_URL) {
	throw new Error("RPC_URL must be set in .env");
}

const rpcUrl = process.env.RPC_URL ?? DEFAULT_RPC_URL;
console.log(`Using RPC: ${rpcUrl}`);
const keypairPath =
	process.env.KEYPAIR_PATH ?? path.resolve(process.cwd(), "id.json");

function ensureKeypairFile(filePath: string): void {
	if (fs.existsSync(filePath)) return;
	const keypair = Keypair.generate();
	fs.writeFileSync(filePath, JSON.stringify(Array.from(keypair.secretKey)));
}

function loadKeypair(filePath: string): Keypair {
	ensureKeypairFile(filePath);
	const raw = fs.readFileSync(filePath, "utf-8");
	const secretKey = Uint8Array.from(JSON.parse(raw));
	return Keypair.fromSecretKey(secretKey);
}

export const connection = new Connection(rpcUrl, "confirmed");
export const walletKeypair = loadKeypair(keypairPath);

export const rpcConfig = {
	rpcUrl,
	keypairPath,
};
