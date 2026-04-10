import {	ComputeBudgetProgram,	PublicKey,	Transaction,	TransactionInstruction,	} from "@solana/web3.js";
import crypto from "crypto";
import { connection, walletKeypair } from "../config/rpc";
import { getSettings } from "../config/settings";
import { buildFlashLoanPlan } from "./flashLoanManager";
import { StrategyDecision } from "../bot/strategyEngine";

type FlashLoanExecutionResult = {
	signature: string;
	lastValidBlockHeight: number;
	repaymentAmount: bigint;
};

function requireSetting(value: string, label: string): string {
	if (!value) {
		throw new Error(`${label} is not configured`);
	}
	return value;
}

function buildExecuteArbitrageInstruction(
	minimumProfit: bigint,
	repaymentAmount: bigint,
	settings: ReturnType<typeof getSettings>
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

// Execute a Solend flash loan + swaps + repayment in a single transaction.
export async function executeFlashLoanArbitrage(
	decision: StrategyDecision,
	swapInstructions: TransactionInstruction[] = []
): Promise<FlashLoanExecutionResult> {
	const settings = getSettings();
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
	const flashLoanFeeReceiver = new PublicKey(
		requireSetting(settings.flashLoanFeeReceiverAccount, "FLASH_LOAN_FEE_RECEIVER")
	);
	const flashLoanHostFeeReceiver = new PublicKey(
		requireSetting(
			settings.flashLoanHostFeeReceiverAccount,
			"FLASH_LOAN_HOST_FEE_RECEIVER"
		)
	);
	const flashLoanMarket = new PublicKey(
		requireSetting(settings.flashLoanLendingMarketAccount, "FLASH_LOAN_MARKET")
	);
	const inputTokenAccount = new PublicKey(
		requireSetting(settings.inputTokenAccount, "INPUT_TOKEN_ACCOUNT")
	);
	const outputTokenAccount = new PublicKey(
		requireSetting(settings.outputTokenAccount, "OUTPUT_TOKEN_ACCOUNT")
	);

	const transaction = new Transaction();
	const instructions: TransactionInstruction[] = [];

	if (settings.computeUnitLimit > 0) {
		instructions.push(
			ComputeBudgetProgram.setComputeUnitLimit({
				units: settings.computeUnitLimit,
			})
		);
	}

	if (settings.priorityFeeMicroLamports > 0) {
		instructions.push(
			ComputeBudgetProgram.setComputeUnitPrice({
				microLamports: settings.priorityFeeMicroLamports,
			})
		);
	}

	const borrowInstructionIndex = instructions.length;
	const flashLoanPlan = buildFlashLoanPlan(
		{
			programId: flashLoanProgramId,
			amount: decision.scanResult.initialAmount,
			feeBps: settings.flashLoanFeeBps,
			reserveAccount: flashLoanReserve,
			liquidityAccount: flashLoanLiquidity,
			feeReceiverAccount: flashLoanFeeReceiver,
			hostFeeReceiverAccount: flashLoanHostFeeReceiver,
			lendingMarketAccount: flashLoanMarket,
			destinationTokenAccount: inputTokenAccount,
			sourceTokenAccount: outputTokenAccount,
			userTransferAuthority: walletKeypair.publicKey,
		},
		borrowInstructionIndex
	);

	const arbitrageInstruction = buildExecuteArbitrageInstruction(
		settings.minProfitThreshold,
		flashLoanPlan.repaymentAmount,
		settings
	);

	instructions.push(
		flashLoanPlan.borrowInstruction,
		...swapInstructions,
		arbitrageInstruction,
		flashLoanPlan.repayInstruction
	);

	transaction.add(...instructions);

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

	return {
		signature,
		lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
		repaymentAmount: flashLoanPlan.repaymentAmount,
	};
}
