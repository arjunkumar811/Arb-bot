import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { getFlashLoanInstructions } from '../solana/flashLoan';
import { getSwapInstructions } from '../solana/jupiterSwap';
import { info, error } from '../utils/logger';

export async function buildArbTransaction({
  connection,
  userPublicKey,
  flashLoanAmount,
  flashLoanMint,
  swapRoutes,
}: {
  connection: Connection;
  userPublicKey: PublicKey;
  flashLoanAmount: number;
  flashLoanMint: string;
  swapRoutes: any[];
}): Promise<Transaction> {
  try {
    // Build swap instructions
    const swapInstructions: TransactionInstruction[] = [];
    for (const quote of swapRoutes) {
      const swapIxsRes = await getSwapInstructions(quote, userPublicKey);
      if (swapIxsRes && swapIxsRes.swapInstruction) {
        // Convert Jupiter's instruction format to TransactionInstruction if needed
        // Here, you may need to use web3.js to decode the instruction if not already a TransactionInstruction
        // For now, we assume swapIxsRes.swapInstruction is a TransactionInstruction or compatible
        swapInstructions.push(swapIxsRes.swapInstruction as unknown as TransactionInstruction);
      }
    }
    // Build flash loan instructions (borrow, swap, repay)
    const flashLoanIxs = await getFlashLoanInstructions({
      connection,
      amount: flashLoanAmount,
      tokenMint: flashLoanMint,
      userPublicKey,
      swapInstructions,
    });
    // Compose transaction
    const tx = new Transaction();
    for (const ix of flashLoanIxs) tx.add(ix);
    info('Transaction built with', flashLoanIxs.length, 'instructions');
    return tx;
  } catch (e) {
    error('Failed to build transaction', e);
    throw e;
  }
}
