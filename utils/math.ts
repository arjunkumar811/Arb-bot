import BN from 'bn.js';

export function toBN(amount: number, decimals: number): BN {
  return new BN(Math.floor(amount * 10 ** decimals));
}

export function fromBN(bn: BN, decimals: number): number {
  return bn.toNumber() / 10 ** decimals;
}

export function calculateProfit({
  sellAmount,
  buyAmount,
  flashLoanFee,
  dexFees,
  networkFees,
}: {
  sellAmount: number;
  buyAmount: number;
  flashLoanFee: number;
  dexFees: number;
  networkFees: number;
}): number {
  return sellAmount - buyAmount - flashLoanFee - dexFees - networkFees;
}
