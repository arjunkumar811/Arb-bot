const FLASH_LOAN_FEE = 0.05;
const DEX_FEE = 0.10;
const NETWORK_FEE = 0.02;
const MIN_PROFIT_THRESHOLD = 0.2;

export interface OpportunityResult {
  rawProfit: number;
  totalFees: number;
  netProfit: number;
  isProfitable: boolean;
}

export function checkOpportunity(buyPrice: number, sellPrice: number): OpportunityResult {
  const rawProfit = sellPrice - buyPrice;
  const totalFees = FLASH_LOAN_FEE + DEX_FEE + NETWORK_FEE;
  const netProfit = rawProfit - totalFees;
  const isProfitable = netProfit > MIN_PROFIT_THRESHOLD;

  console.log(`Raw Profit: ${rawProfit.toFixed(2)}`);
  console.log(`Total Fees: ${totalFees.toFixed(2)}`);
  console.log(`Net Profit: ${netProfit.toFixed(2)}`);
  console.log(`Profitable: ${isProfitable}`);

  return {
    rawProfit,
    totalFees,
    netProfit,
    isProfitable,
  };
}
