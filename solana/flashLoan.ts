import { TransactionInstruction, PublicKey, Connection } from '@solana/web3.js';
import { SolendMarket, SolendAction } from '@solendprotocol/solend-sdk';

export async function getFlashLoanInstructions(
  params: {
    connection: Connection;
    amount: number;
    tokenMint: string;
    userPublicKey: PublicKey;
    swapInstructions: TransactionInstruction[];
  }
): Promise<TransactionInstruction[]> {
  const { connection, amount, tokenMint, userPublicKey, swapInstructions } = params;
  // Load Solend market
  const market = await SolendMarket.initialize(connection);
  await market.loadReserves();
  const reserve = market.reserves.find(r => r.config.mintAddress === tokenMint);
  if (!reserve) throw new Error('Reserve not found for token');

  // Build borrow transaction (flash loan)
  const borrowAction = await SolendAction.buildBorrowTxns(
    connection,
    amount.toString(),
    reserve.config.symbol,
    userPublicKey,
    'production'
  );
  const borrowTxns = await borrowAction.getTransactions();
  const borrowIxs = borrowTxns.lendingTxn ? borrowTxns.lendingTxn.instructions : [];

  // Build repay transaction
  const repayAction = await SolendAction.buildRepayTxns(
    connection,
    amount.toString(),
    reserve.config.symbol,
    userPublicKey,
    'production'
  );
  const repayTxns = await repayAction.getTransactions();
  const repayIxs = repayTxns.lendingTxn ? repayTxns.lendingTxn.instructions : [];

  // Compose: borrow, swap(s), repay
  return [
    ...borrowIxs,
    ...swapInstructions,
    ...repayIxs
  ];
}
