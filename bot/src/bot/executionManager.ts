import {
	ComputeBudgetProgram,
	PublicKey,
	Transaction,
	TransactionInstruction,
} from "@solana/web3.js";
import crypto from "crypto";
import { connection, walletKeypair } from "../config/rpc";
import { settings } from "../config/settings";
import { buildFlashLoanPlan } from "../loan/flashLoanManager";
import { logFlashLoan, logFailure, logInfo, logSuccess } from "../utils/logger";
import { StrategyDecision } from "./strategyEngine";

function requireSetting(value: string, label: string): string {
	if (!value) {
		throw new Error(`${label} is not configured`);
	}
	return value;
}

function buildExecuteArbitrageInstruction(
	minimumProfit: bigint,
	repaymentAmount: bigint
): TransactionInstruction {
	const programId = new PublicKey(
		requireSetting(settings.arbitrageProgramId, "ARB_PROGRAM_ID")
	);
	const inputTokenAccount = new PublicKey(
		requireSetting(settings.inputTokenAccount, "INPUT_TOKEN_ACCOUNT")
	);
	const outputTokenAccount = new PublicKey(
		requireSetting(settings.outputTokenAccount, "OUTPUT_TOKEN_ACCOUNT")
	);
	const tokenProgramId = new PublicKey(settings.tokenProgramId);

	const discriminator = crypto
		.createHash("sha256")
		.update("global:execute_arbitrage")
		.digest()
		.subarray(0, 8);

	const data = Buffer.alloc(8 + 8 + 8);
	discriminator.copy(data, 0);
	data.writeBigUInt64LE(minimumProfit, 8);
	data.writeBigUInt64LE(repaymentAmount, 16);

	return new TransactionInstruction({
		programId,
		keys: [
			{ pubkey: walletKeypair.publicKey, isSigner: true, isWritable: true },
			{ pubkey: inputTokenAccount, isSigner: false, isWritable: true },
			{ pubkey: outputTokenAccount, isSigner: false, isWritable: true },
			{ pubkey: tokenProgramId, isSigner: false, isWritable: false },
		],
		data,
	});
}

export async function executePipeline(decision: StrategyDecision): Promise<void> {
	if (!decision.shouldExecute || !decision.scanResult) {
		throw new Error(decision.reason ?? "No profitable opportunity");
	}

	const flashLoanProgramId = new PublicKey(
		requireSetting(settings.flashLoanProgramId, "FLASH_LOAN_PROGRAM_ID")
	);
	const flashLoanReserve = new PublicKey(
		requireSetting(settings.flashLoanReserveAccount, "FLASH_LOAN_RESERVE")
	);
	const flashLoanLiquidity = new PublicKey(
		requireSetting(settings.flashLoanLiquidityAccount, "FLASH_LOAN_LIQUIDITY")
	);
	const flashLoanOwner = new PublicKey(
		requireSetting(settings.flashLoanOwnerAccount, "FLASH_LOAN_OWNER")
	);

	const flashLoanPlan = buildFlashLoanPlan({
		programId: flashLoanProgramId,
		amount: decision.scanResult.initialAmount,
		feeBps: settings.flashLoanFeeBps,
		reserveAccount: flashLoanReserve,
		liquidityAccount: flashLoanLiquidity,
		ownerAccount: flashLoanOwner,
	});

	logFlashLoan(flashLoanPlan.repaymentAmount, "Flash loan requested");

	const instruction = buildExecuteArbitrageInstruction(
		settings.minProfitThreshold,
		flashLoanPlan.repaymentAmount
	);

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

	transaction.add(flashLoanPlan.instruction, instruction);

	const latestBlockhash = await connection.getLatestBlockhash();
	transaction.recentBlockhash = latestBlockhash.blockhash;
	transaction.feePayer = walletKeypair.publicKey;

	transaction.sign(walletKeypair);

	try {
		const signature = await connection.sendRawTransaction(
			transaction.serialize(),
			{ maxRetries: settings.swapRetries }
		);

		await connection.confirmTransaction({
			signature,
			blockhash: latestBlockhash.blockhash,
			lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
		});

		logSuccess("Arbitrage pipeline executed", signature, decision.profit.toString());
	} catch (error) {
		logFailure("Arbitrage execution failed", undefined, (error as Error).message);
		throw error;
	}

	logInfo("Pipeline completed");
}
