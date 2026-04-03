import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { settings } from "../config/settings";

export type FlashLoanRequest = {
	programId: PublicKey;
	amount: bigint;
	feeBps: number;
	reserveAccount: PublicKey;
	liquidityAccount: PublicKey;
	ownerAccount: PublicKey;
};

export type FlashLoanPlan = {
	instruction: TransactionInstruction;
	repaymentAmount: bigint;
};

export function buildFlashLoanPlan(request: FlashLoanRequest): FlashLoanPlan {
	const fee = (request.amount * BigInt(request.feeBps)) / 10_000n;
	const repaymentAmount = request.amount + fee;

	// Placeholder: construct Solend/Jupiter Lend flash-loan instruction.
	const instruction = new TransactionInstruction({
		programId: request.programId,
		keys: [
			{ pubkey: request.reserveAccount, isSigner: false, isWritable: true },
			{ pubkey: request.liquidityAccount, isSigner: false, isWritable: true },
			{ pubkey: request.ownerAccount, isSigner: false, isWritable: false },
		],
		data: Buffer.alloc(0),
	});

	if (settings.computeUnitLimit > 0 && settings.priorityFeeMicroLamports > 0) {
		// Placeholder: compute budget tuning is configured at the transaction level.
	}

	return { instruction, repaymentAmount };
}

export function validateLoanAmount(amount: bigint, expected: bigint): void {
	if (amount < expected) {
		throw new Error("Flash loan amount below expectation");
	}
}
