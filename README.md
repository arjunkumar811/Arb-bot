# Solana Arbitrage Bot (Devnet)

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
