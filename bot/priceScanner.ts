import { getJupiterQuote } from '../solana/jupiterSwap';
import { getConnection } from '../solana/wallet';
import tokens from '../config/tokens.json';
import { info, error } from '../utils/logger';

export interface PriceInfo {
  buyPrice: number;
  sellPrice: number;
  buyLiquidity: number;
  sellLiquidity: number;
}

export async function fetchPrices(): Promise<PriceInfo> {
  try {
    const amount = 1 * 10 ** tokens.SOL.decimals; // 1 SOL
    const slippage = 0.003;
    // SOL -> USDC
    const solToUsdcQuote = await getJupiterQuote(
      tokens.SOL.mint,
      tokens.USDC.mint,
      amount,
      slippage
    );
    // USDC -> SOL
    const usdcToSolQuote = await getJupiterQuote(
      tokens.USDC.mint,
      tokens.SOL.mint,
      100 * 10 ** tokens.USDC.decimals, // 100 USDC
      slippage
    );
    return {
      buyPrice: solToUsdcQuote?.outAmount ? Number(solToUsdcQuote.outAmount) : 0,
      sellPrice: usdcToSolQuote?.outAmount ? Number(usdcToSolQuote.outAmount) : 0,
      buyLiquidity: solToUsdcQuote?.routePlan?.[0]?.swapInfo?.inAmount ? Number(solToUsdcQuote.routePlan[0].swapInfo.inAmount) : 0,
      sellLiquidity: usdcToSolQuote?.routePlan?.[0]?.swapInfo?.inAmount ? Number(usdcToSolQuote.routePlan[0].swapInfo.inAmount) : 0,
    };
  } catch (e) {
    error('Failed to fetch prices', e);
    return {
      buyPrice: 0,
      sellPrice: 0,
      buyLiquidity: 0,
      sellLiquidity: 0,
    };
  }
}
