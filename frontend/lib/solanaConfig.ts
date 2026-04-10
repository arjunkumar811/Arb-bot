import { PublicKey } from "@solana/web3.js";

const missing: string[] = [];
const invalid: string[] = [];

const RPC_URL_RAW = (process.env.NEXT_PUBLIC_RPC_URL ?? "").trim();
const USDC_MINT_RAW = (process.env.NEXT_PUBLIC_USDC_MINT ?? "").trim();

export const RPC_URL = RPC_URL_RAW;

if (!RPC_URL_RAW) missing.push("NEXT_PUBLIC_RPC_URL");
if (!USDC_MINT_RAW) missing.push("NEXT_PUBLIC_USDC_MINT");

function parsePublicKey(raw: string, label: string): PublicKey | null {
	if (!raw) return null;
	try {
		return new PublicKey(raw);
	} catch {
		invalid.push(label);
		return null;
	}
}

const errorParts: string[] = [];
if (missing.length > 0) {
	errorParts.push(
		`Missing ${missing.join(", ")}. Set it in .env or .env.local before running the app.`
	);
}
if (invalid.length > 0) {
	errorParts.push(`Invalid public key for ${invalid.join(", ")}.`);
}

export const SOLANA_CONFIG_ERROR = errorParts.length > 0 ? errorParts.join(" ") : null;

export const USDC_MINT = parsePublicKey(USDC_MINT_RAW, "NEXT_PUBLIC_USDC_MINT");
