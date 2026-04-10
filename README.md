
<<<<<<< HEAD
Production-grade, clean-architecture Solana arbitrage bot with Jupiter swaps and flash-loan aware validation.

## Features

- Jupiter price scanning and swap execution
- Arbitrage detection with profit thresholds
- Flash-loan repayment validation on-chain (Anchor)
- Retry/backoff, timeouts, and slippage guards
- File-based logging
- Devnet-first configuration

## Prerequisites

- Node.js 18+
- Yarn or npm
- Solana CLI (for keypair and airdrops)
- Anchor (for program build/deploy)

## Setup

1. Create a wallet keypair and airdrop devnet SOL.
2. Place the keypair at `arb-bot/id.json` or set `KEYPAIR_PATH`.
3. Install dependencies in `bot/` (to be added in later phases).

## Environment Variables

Set these in your shell or a `.env` file you load manually:

```
RPC_URL=https://api.devnet.solana.com
KEYPAIR_PATH=./id.json
START_AMOUNT=1000000
MIN_PROFIT_THRESHOLD=0
LOOP_DELAY_MS=5000
SLIPPAGE_BPS=50
SWAP_RETRIES=3
QUOTE_TIMEOUT_MS=10000
SWAP_TIMEOUT_MS=20000
CONFIRM_TIMEOUT_MS=30000
PRIORITY_FEE_MICROLAMPORTS=0
COMPUTE_UNIT_LIMIT=0
LOG_FILE=./logs/arb-bot.log
FLASH_LOAN_PROGRAM_ID=So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo
FLASH_LOAN_MARKET=4UpD2fh7xH3VP9QQaXtsS1YY3bxzWhtfpks7FatyKvdY
FLASH_LOAN_RESERVE=BgxfHJDzm44T7XG68MYKx7YisTjZu73tVovyZSjJMpmw
FLASH_LOAN_LIQUIDITY=8SheGtsopRUDzdiD6v6BR9a6bqZ9QwywYQY99Fp5meNf
FLASH_LOAN_FEE_RECEIVER=5Gdxn4yquneifE6uk9tK8X4CqHfWKjW2BvYU25hAykwP
FLASH_LOAN_HOST_FEE_RECEIVER=5Gdxn4yquneifE6uk9tK8X4CqHfWKjW2BvYU25hAykwP
```

For USDT on Solend mainnet, use:

```
FLASH_LOAN_RESERVE=8K9WC8xoh2rtQNY7iEGXtPvfbDCi563SdWhCAhuMP2xE
FLASH_LOAN_LIQUIDITY=3CdpSW5dxM7RTxBgxeyt8nnnjqoDbZe48tsBs9QUrmuN
FLASH_LOAN_FEE_RECEIVER=Cpyk5WRGmdK2yFGTJCrmgyABPiNEF5eCyCMMZLxpdkXu
FLASH_LOAN_HOST_FEE_RECEIVER=Cpyk5WRGmdK2yFGTJCrmgyABPiNEF5eCyCMMZLxpdkXu
```

## Running the Bot

From `arb-bot/bot`:

```
npm run build
npm run start
```

## Testing a Swap

From `arb-bot/scripts`:

```
npx ts-node testSwap.ts
```

## Example Output

```
Opportunity found. Profit: 1200
Swap success: 5f9s2x...abc
```

## Notes

- This repo is devnet-first. Ensure token mint addresses are correct for devnet.
- Flash-loan CPI wiring is intentionally minimal and should be extended before production use.





// 1. dev net
// 2. Token Account
// 3. not only for usdt & usdc
=======
>>>>>>> 5f90bffc3349bb1cb1e2040f8c12ff17192aaf90
