import { scanPrices } from './priceScanner';

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
        console.log('Invalid price received');
        console.log('Scanning again...\n');
        await new Promise(res => setTimeout(res, 5000));
        continue;
      }

      console.log('Scanning again...\n');
    } catch (error) {
      console.error('Main loop error', error);
    }
    await new Promise(res => setTimeout(res, 5000));
  }
}

main();
