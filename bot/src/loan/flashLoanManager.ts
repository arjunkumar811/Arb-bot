import {
	PublicKey,
	SYSVAR_INSTRUCTIONS_PUBKEY,
	TransactionInstruction,
} from "@solana/web3.js";
import { settings } from "../config/settings";

export type FlashLoanRequest = {
	programId: PublicKey;
	amount: bigint;
	feeBps: number;
	reserveAccount: PublicKey;
	liquidityAccount: PublicKey;
	feeReceiverAccount: PublicKey;
	hostFeeReceiverAccount: PublicKey;
	lendingMarketAccount: PublicKey;
	destinationTokenAccount: PublicKey;
	sourceTokenAccount: PublicKey;
	userTransferAuthority: PublicKey;
};

export type FlashLoanPlan = {
	borrowInstruction: TransactionInstruction;
	repayInstruction: TransactionInstruction;
	repaymentAmount: bigint;
};

function packFlashBorrow(amount: bigint): Buffer {
	const data = Buffer.alloc(9);
	data.writeUInt8(19, 0);
	data.writeBigUInt64LE(amount, 1);
	return data;
}

function packFlashRepay(amount: bigint, borrowInstructionIndex: number): Buffer {
	const data = Buffer.alloc(10);
	data.writeUInt8(20, 0);
	data.writeBigUInt64LE(amount, 1);
	data.writeUInt8(borrowInstructionIndex, 9);
	return data;
}

export function buildFlashLoanPlan(
	request: FlashLoanRequest,
	borrowInstructionIndex: number
): FlashLoanPlan {
	const fee = (request.amount * BigInt(request.feeBps)) / 10_000n;
	const repaymentAmount = request.amount + fee;
	const [marketAuthority] = PublicKey.findProgramAddressSync(
		[request.lendingMarketAccount.toBytes()],
		request.programId
	);

	const borrowInstruction = new TransactionInstruction({
		programId: request.programId,
		keys: [
			{ pubkey: request.liquidityAccount, isSigner: false, isWritable: true },
			{ pubkey: request.destinationTokenAccount, isSigner: false, isWritable: true },
			{ pubkey: request.reserveAccount, isSigner: false, isWritable: true },
			{ pubkey: request.lendingMarketAccount, isSigner: false, isWritable: false },
			{ pubkey: marketAuthority, isSigner: false, isWritable: false },
			{ pubkey: SYSVAR_INSTRUCTIONS_PUBKEY, isSigner: false, isWritable: false },
			{ pubkey: new PublicKey(settings.tokenProgramId), isSigner: false, isWritable: false },
		],
		data: packFlashBorrow(request.amount),
	});

	const repayInstruction = new TransactionInstruction({
		programId: request.programId,
		keys: [
			{ pubkey: request.sourceTokenAccount, isSigner: false, isWritable: true },
			{ pubkey: request.liquidityAccount, isSigner: false, isWritable: true },
			{ pubkey: request.feeReceiverAccount, isSigner: false, isWritable: true },
			{ pubkey: request.hostFeeReceiverAccount, isSigner: false, isWritable: true },
			{ pubkey: request.reserveAccount, isSigner: false, isWritable: true },
			{ pubkey: request.lendingMarketAccount, isSigner: false, isWritable: false },
			{ pubkey: request.userTransferAuthority, isSigner: true, isWritable: false },
			{ pubkey: SYSVAR_INSTRUCTIONS_PUBKEY, isSigner: false, isWritable: false },
			{ pubkey: new PublicKey(settings.tokenProgramId), isSigner: false, isWritable: false },
		],
		data: packFlashRepay(request.amount, borrowInstructionIndex),
	});

	if (settings.computeUnitLimit > 0 && settings.priorityFeeMicroLamports > 0) {
		// Placeholder: compute budget tuning is configured at the transaction level.
	}

	return { borrowInstruction, repayInstruction, repaymentAmount };
}

export function validateLoanAmount(amount: bigint, expected: bigint): void {
	if (amount < expected) {
		throw new Error("Flash loan amount below expectation");
	}
}
