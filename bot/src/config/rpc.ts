import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";
import fs from "fs";
import path from "path";

const DEFAULT_RPC_URL = clusterApiUrl("devnet");

const rpcUrl = process.env.RPC_URL ?? DEFAULT_RPC_URL;
const keypairPath =
	process.env.KEYPAIR_PATH ?? path.resolve(process.cwd(), "id.json");

function loadKeypair(filePath: string): Keypair {
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
