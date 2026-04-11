import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { connection, walletKeypair } from "../config/rpc";
import { TOKENS } from "../config/tokens";
import { emitEvent } from "../server/wsClient";

export async function emitWalletUpdate(): Promise<void> {
	const owner = walletKeypair.publicKey;
	const solBalance = await connection.getBalance(owner);

	const usdcAta = getAssociatedTokenAddressSync(
		new PublicKey(TOKENS.USDC.mint),
		owner
	);
	const usdtAta = getAssociatedTokenAddressSync(
		new PublicKey(TOKENS.USDT.mint),
		owner
	);

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
