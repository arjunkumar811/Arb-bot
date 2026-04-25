import { PriceInfo } from './priceScanner';
import { calculateProfit } from '../utils/math';
import { MIN_PROFIT_THRESHOLD, MAX_SLIPPAGE } from '../config/settings';
import { info } from '../utils/logger';

export interface Opportunity {
  profit: number;
  buyAmount: number;
  sellAmount: number;
  isProfitable: boolean;
}

export function detectOpportunity(prices: PriceInfo): Opportunity {
  // Example: buy SOL, sell USDC
  const buyAmount = prices.buyPrice;
  const sellAmount = prices.sellPrice;
  const flashLoanFee = 0.0003 * buyAmount; // Example fee
  const dexFees = 0.0005 * buyAmount; // Example DEX fee
  const networkFees = 0.0001 * buyAmount; // Example network fee
  const profit = calculateProfit({
    sellAmount,
    buyAmount,
    flashLoanFee,
    dexFees,
    networkFees,
  });
  const isProfitable = profit > MIN_PROFIT_THRESHOLD;
  if (isProfitable) {
    info('Opportunity detected', { profit, buyAmount, sellAmount });
  }
  return { profit, buyAmount, sellAmount, isProfitable };
}
