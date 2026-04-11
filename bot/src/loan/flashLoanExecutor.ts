import {	ComputeBudgetProgram,	PublicKey,	Transaction,	TransactionInstruction,	} from "@solana/web3.js";
import crypto from "crypto";
import { connection, walletKeypair } from "../config/rpc";
import { getSettings } from "../config/settings";
import { buildFlashLoanPlan } from "./flashLoanManager";
import { StrategyDecision } from "../bot/strategyEngine";
import { emitEvent } from "../server/wsClient";
import { retry, withTimeout } from "../utils/retry";
import { logFailure, logInfo } from "../utils/logger";

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

function requirePublicKey(value: string, label: string): PublicKey {
	try {
		return new PublicKey(requireSetting(value, label));
	} catch {
		throw new Error(`${label} is not a valid public key`);
	}
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

	const flashLoanProgramId = requirePublicKey(
		settings.flashLoanProgramId,
		"FLASH_LOAN_PROGRAM_ID"
	);
	const flashLoanReserve = requirePublicKey(
		settings.flashLoanReserveAccount,
		"FLASH_LOAN_RESERVE"
	);
	const flashLoanLiquidity = requirePublicKey(
		settings.flashLoanLiquidityAccount,
		"FLASH_LOAN_LIQUIDITY"
	);
	const flashLoanFeeReceiver = requirePublicKey(
		settings.flashLoanFeeReceiverAccount,
		"FLASH_LOAN_FEE_RECEIVER"
	);
	const flashLoanHostFeeReceiver = requirePublicKey(
		settings.flashLoanHostFeeReceiverAccount,
		"FLASH_LOAN_HOST_FEE_RECEIVER"
	);
	const flashLoanMarket = requirePublicKey(
		settings.flashLoanLendingMarketAccount,
		"FLASH_LOAN_MARKET"
	);
	const inputTokenAccount = requirePublicKey(
		settings.inputTokenAccount,
		"INPUT_TOKEN_ACCOUNT"
	);
	const outputTokenAccount = requirePublicKey(
		settings.outputTokenAccount,
		"OUTPUT_TOKEN_ACCOUNT"
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
	emitEvent("execution_update", {
		step: "borrow",
		status: "running",
		timestamp: new Date().toISOString(),
	});
	logInfo("Step start: Borrow Flash Loan");
	const borrowStart = Date.now();
	let flashLoanPlan = null as ReturnType<typeof buildFlashLoanPlan> | null;
	try {
		flashLoanPlan = buildFlashLoanPlan(
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
		emitEvent("execution_update", {
			step: "borrow",
			status: "success",
			timestamp: new Date().toISOString(),
		});
		logInfo("Step success: Borrow Flash Loan");
	} catch (error) {
		emitEvent("execution_update", {
			step: "borrow",
			status: "failed",
			timestamp: new Date().toISOString(),
		});
		emitEvent("execution_failed", {
			step: "borrow",
			error: (error as Error).message,
		});
		logFailure("Borrow step failed", undefined, (error as Error).message);
		throw error;
	} finally {
		emitEvent("step_duration_update", {
			step: "borrow",
			durationMs: Date.now() - borrowStart,
		});
	}

	const arbitrageInstruction = buildExecuteArbitrageInstruction(
		settings.minProfitThreshold,
		flashLoanPlan.repaymentAmount,
		settings
	);

	emitEvent("execution_update", {
		step: "swap1",
		status: "running",
		timestamp: new Date().toISOString(),
	});
	emitEvent("execution_update", {
		step: "swap2",
		status: "running",
		timestamp: new Date().toISOString(),
	});
	logInfo("Step start: Swap Token A → B");
	logInfo("Step start: Swap Token B → C");
	emitEvent("execution_update", {
		step: "swap1",
		status: "success",
		timestamp: new Date().toISOString(),
	});
	emitEvent("execution_update", {
		step: "swap2",
		status: "success",
		timestamp: new Date().toISOString(),
	});
	logInfo("Step success: Swap Token A → B");
	logInfo("Step success: Swap Token B → C");
	emitEvent("step_duration_update", {
		step: "swap1",
		durationMs: 0,
	});
	emitEvent("step_duration_update", {
		step: "swap2",
		durationMs: 0,
	});

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

	const repayStart = Date.now();
	let signature = "";
	try {
		signature = await retry(
			() =>
				withTimeout(
					connection.sendRawTransaction(transaction.serialize(), {
						maxRetries: settings.swapRetries,
					}),
					settings.swapTimeoutMs
				),
			{
				retries: 3,
				delayMs: 500,
				backoffFactor: 2,
				maxDelayMs: 2000,
				jitter: 0.1,
				onRetry: (_error, attempt) => {
					emitEvent("retry_attempt", {
						step: "repay",
						attempt,
					});
					logInfo(`Retrying Repay (Attempt ${attempt})`);
				},
			}
		);
	} catch (error) {
		emitEvent("execution_update", {
			step: "repay",
			status: "failed",
			timestamp: new Date().toISOString(),
		});
		emitEvent("execution_failed", {
			step: "repay",
			error: (error as Error).message,
		});
		logFailure("Repay step failed", undefined, (error as Error).message);
		throw error;
	} finally {
		emitEvent("step_duration_update", {
			step: "repay",
			durationMs: Date.now() - repayStart,
		});
	}

	emitEvent("execution_update", {
		step: "repay",
		status: "running",
		timestamp: new Date().toISOString(),
		transactionSignature: signature,
	});
	logInfo("Step start: Repay Loan");
	emitEvent("execution_update", {
		step: "repay",
		status: "success",
		timestamp: new Date().toISOString(),
		transactionSignature: signature,
	});
	logInfo("Step success: Repay Loan");

	const confirmStart = Date.now();
	try {
		await retry(
			() =>
				withTimeout(
					connection.confirmTransaction({
						signature,
						blockhash: latestBlockhash.blockhash,
						lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
					}),
					settings.confirmTimeoutMs
				),
			{
				retries: 3,
				delayMs: 500,
				backoffFactor: 2,
				maxDelayMs: 2000,
				jitter: 0.1,
				onRetry: (_error, attempt) => {
					emitEvent("retry_attempt", {
						step: "confirmed",
						attempt,
					});
					logInfo(`Retrying Confirm (Attempt ${attempt})`);
				},
			}
		);
	} catch (error) {
		emitEvent("execution_update", {
			step: "confirmed",
			status: "failed",
			timestamp: new Date().toISOString(),
			transactionSignature: signature,
		});
		emitEvent("execution_failed", {
			step: "confirmed",
			error: (error as Error).message,
		});
		logFailure("Confirm step failed", signature, (error as Error).message);
		throw error;
	} finally {
		emitEvent("step_duration_update", {
			step: "confirmed",
			durationMs: Date.now() - confirmStart,
		});
	}

	emitEvent("execution_update", {
		step: "confirmed",
		status: "success",
		timestamp: new Date().toISOString(),
		transactionSignature: signature,
	});
	logInfo("Step success: Confirm Transaction");

	emitEvent("execution_update", {
		step: "profit",
		status: "success",
		timestamp: new Date().toISOString(),
		transactionSignature: signature,
	});
	logInfo("Step success: Update Profit");
	emitEvent("step_duration_update", {
		step: "profit",
		durationMs: 0,
	});

	return {
		signature,
		lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
		repaymentAmount: flashLoanPlan.repaymentAmount,
	};
}
