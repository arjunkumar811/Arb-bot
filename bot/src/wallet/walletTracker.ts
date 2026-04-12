import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { connection, walletKeypair } from "../config/rpc";
import { readRuntimeSettings } from "../config/runtime";
import { TOKENS } from "../config/tokens";
import { emitEvent } from "../server/wsClient";

export async function emitWalletUpdate(): Promise<void> {
	const runtime = readRuntimeSettings();
	const owner = runtime.wallet
		? new PublicKey(runtime.wallet)
		: walletKeypair.publicKey;
	const solBalance = await connection.getBalance(owner);
	const usdcAta = runtime.inputTokenAccount
		? new PublicKey(runtime.inputTokenAccount)
		: getAssociatedTokenAddressSync(new PublicKey(TOKENS.USDC.mint), owner);
	const usdtAta = runtime.outputTokenAccount
		? new PublicKey(runtime.outputTokenAccount)
		: getAssociatedTokenAddressSync(new PublicKey(TOKENS.USDT.mint), owner);

	const [usdcAccount, usdtAccount] = await Promise.all([
		connection.getTokenAccountBalance(usdcAta).catch(() => null),
		connection.getTokenAccountBalance(usdtAta).catch(() => null),
	]);

	emitEvent("wallet_update", {
		solBalance,
		usdcBalance: usdcAccount?.value?.amount ?? "0",
		usdtBalance: usdtAccount?.value?.amount ?? "0",
	});
}
