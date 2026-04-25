import { Connection, Transaction, Keypair } from '@solana/web3.js';
import { info, error } from '../utils/logger';

export async function simulateAndSend({
  connection,
  transaction,
  signer,
}: {
  connection: Connection;
  transaction: Transaction;
  signer: Keypair;
}): Promise<{ success: boolean; txid?: string; error?: any }> {
  try {
    // Simulate
    const simResult = await connection.simulateTransaction(transaction);
    if (simResult.value.err) {
      error('Simulation failed', simResult.value.err);
      return { success: false, error: simResult.value.err };
    }
    info('Simulation successful');
    // Send
    const txid = await connection.sendTransaction(transaction, [signer]);
    info('Transaction sent', txid);
    return { success: true, txid };
  } catch (e) {
    error('Execution failed', e);
    return { success: false, error: e };
  }
}
