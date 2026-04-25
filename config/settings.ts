import dotenv from 'dotenv';
dotenv.config();

export const MIN_PROFIT_THRESHOLD = process.env.MIN_PROFIT_THRESHOLD ? Number(process.env.MIN_PROFIT_THRESHOLD) : 5; // USDC
export const MAX_SLIPPAGE = process.env.MAX_SLIPPAGE ? Number(process.env.MAX_SLIPPAGE) / 100 : 0.003; // 0.3% as decimal

export const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || '';
