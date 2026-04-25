import { Keypair, Connection } from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

export function getKeypair(): Keypair {
  if (!process.env.PRIVATE_KEY) throw new Error('PRIVATE_KEY env not set');
  const secret = Uint8Array.from(JSON.parse(process.env.PRIVATE_KEY));
  return Keypair.fromSecretKey(secret);
}

export function getConnection(): Connection {
  if (!process.env.SOLANA_RPC_URL) throw new Error('SOLANA_RPC_URL env not set');
  return new Connection(process.env.SOLANA_RPC_URL, 'confirmed');
}
