import {	ComputeBudgetProgram,	PublicKey,	Transaction,	TransactionInstruction,	} from "@solana/web3.js";
import { connection, walletKeypair } from "../bot/src/config/rpc";
import { settings } from "../bot/src/config/settings";
import { buildFlashLoanPlan } from "../bot/src/loan/flashLoanManager";

function requireSetting(value: string, label: string): string {
	if (!value) {
		throw new Error(`${label} is not configured`);
	}
	return value;
}

async function testFlashLoan(): Promise<void> {
	const programId = new PublicKey(
		requireSetting(settings.flashLoanProgramId, "FLASH_LOAN_PROGRAM_ID")
	);
	const reserve = new PublicKey(
		requireSetting(settings.flashLoanReserveAccount, "FLASH_LOAN_RESERVE")
	);
	const liquidity = new PublicKey(
		requireSetting(settings.flashLoanLiquidityAccount, "FLASH_LOAN_LIQUIDITY")
	);
	const owner = new PublicKey(
		requireSetting(settings.flashLoanOwnerAccount, "FLASH_LOAN_OWNER")
	);

	const amount = settings.startAmount;

	const plan = buildFlashLoanPlan({
		programId,
		amount,
		feeBps: settings.flashLoanFeeBps,
		reserveAccount: reserve,
		liquidityAccount: liquidity,
		ownerAccount: owner,
	});

	console.log(`Flash loan requested: ${amount.toString()}`);
	console.log(`Repayment amount: ${plan.repaymentAmount.toString()}`);

	const repayInstruction = new TransactionInstruction({
		programId,
		keys: [
			{ pubkey: reserve, isSigner: false, isWritable: true },
			{ pubkey: liquidity, isSigner: false, isWritable: true },
		],
		data: Buffer.alloc(0),
	});

	const transaction = new Transaction();

	if (settings.computeUnitLimit > 0) {
		transaction.add(
			ComputeBudgetProgram.setComputeUnitLimit({
				units: settings.computeUnitLimit,
			})
		);
	}

	if (settings.priorityFeeMicroLamports > 0) {
		transaction.add(
			ComputeBudgetProgram.setComputeUnitPrice({
				microLamports: settings.priorityFeeMicroLamports,
			})
		);
	}

	transaction.add(plan.instruction, repayInstruction);

	const latestBlockhash = await connection.getLatestBlockhash();
	transaction.recentBlockhash = latestBlockhash.blockhash;
	transaction.feePayer = walletKeypair.publicKey;
	transaction.sign(walletKeypair);

	const signature = await connection.sendRawTransaction(transaction.serialize(), {
		maxRetries: settings.swapRetries,
	});

	await connection.confirmTransaction({
		signature,
		blockhash: latestBlockhash.blockhash,
		lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
	});

	console.log("Flash loan test success:", signature);
}

testFlashLoan().catch((error) => {
	console.error("Flash loan test failed:", error);
	process.exit(1);
});
