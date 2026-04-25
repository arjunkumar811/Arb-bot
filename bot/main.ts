import { scanPrices } from './priceScanner';
import { checkOpportunity } from './opportunityEngine';

async function main() {
  console.log('\n🚀 Flash Arbitrage Bot Started\n');

  while (true) {
    try {
      console.log('📡 Fetching Prices...\n');
      const prices = await scanPrices();
      if (!prices) {
        console.log('Scanning again...\n');
        await new Promise(res => setTimeout(res, 5000));
        continue;
      }

      if (prices.buyPrice === 0 || prices.sellPrice === 0) {
        console.log('Invalid prices received');
        console.log('Scanning again...\n');
        await new Promise(res => setTimeout(res, 5000));
        continue;
      }

      const result = checkOpportunity(prices.buyPrice, prices.sellPrice);
      if (result.isProfitable) {
        console.log('🚨 Arbitrage Opportunity Found!\n');
      } else {
        console.log('No profitable opportunity.\n');
      }

      console.log('Scanning again...\n');
    } catch (error) {
      console.error('Main loop error', error);
    }
    await new Promise(res => setTimeout(res, 5000));
  }
}

main();
