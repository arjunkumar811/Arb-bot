const JUPITER_QUOTE_URLS = [
  'https://api.jup.ag/swap/v1/quote',
  'https://lite-api.jup.ag/swap/v1/quote',
];
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const SOL_DECIMALS = 9;
const USDC_DECIMALS = 6;
const SOL_AMOUNT = 0.001;
const SOL_AMOUNT_LAMPORTS = Math.floor(SOL_AMOUNT * 10 ** SOL_DECIMALS);

interface JupiterQuoteResponse {
  outAmount: string;
}

export interface ScannedPrices {
  buyPrice: number;
  sellPrice: number;
}

let cooldownUntilMs = 0;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseRetryAfterMs(value: string | null): number {
  if (!value) return 0;
  const asSeconds = Number(value);
  if (Number.isFinite(asSeconds) && asSeconds > 0) {
    return Math.floor(asSeconds * 1000);
  }

  const asDate = Date.parse(value);
  if (!Number.isNaN(asDate)) {
    return Math.max(asDate - Date.now(), 0);
  }

  return 0;
}

async function fetchQuote(
  inputMint: string,
  outputMint: string,
  amount: number
): Promise<JupiterQuoteResponse> {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: String(amount),
    slippageBps: '30',
    swapMode: 'ExactIn',
    restrictIntermediateTokens: 'true',
  });

  if (Date.now() < cooldownUntilMs) {
    const waitMs = cooldownUntilMs - Date.now();
    console.log(`Rate limited by Jupiter, waiting ${Math.ceil(waitMs / 1000)}s...`);
    await sleep(waitMs);
  }

  let lastError: unknown;
  let maxRetryAfterMs = 0;

  for (const baseUrl of JUPITER_QUOTE_URLS) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await fetch(`${baseUrl}?${params.toString()}`, {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'flash-arb-bot/1.0',
          },
        });

        if (response.status === 429) {
          const retryAfterMs = parseRetryAfterMs(response.headers.get('retry-after'));
          maxRetryAfterMs = Math.max(maxRetryAfterMs, retryAfterMs);
          const backoffMs = Math.min(12000, 1500 * 2 ** attempt) + Math.floor(Math.random() * 500);
          await sleep(Math.max(retryAfterMs, backoffMs));
          continue;
        }

        if (!response.ok) {
          throw new Error(`Jupiter quote failed with status ${response.status}`);
        }

        const data = (await response.json()) as JupiterQuoteResponse;
        if (!data?.outAmount) {
          throw new Error('Jupiter quote missing outAmount');
        }

        return data;
      } catch (error) {
        lastError = error;
        if (attempt < 2) {
          const retryDelayMs = 1000 * (attempt + 1);
          await sleep(retryDelayMs);
        }
      }
    }
  }

  if (maxRetryAfterMs > 0) {
    cooldownUntilMs = Date.now() + Math.max(maxRetryAfterMs, 10000);
  }

  throw lastError ?? new Error('Jupiter quote fetch failed');
}

export async function scanPrices(): Promise<ScannedPrices | null> {
  try {
    console.log('Fetching Jupiter price...');

    // Quote 1: SOL -> USDC for 0.001 SOL.
    const solToUsdc = await fetchQuote(SOL_MINT, USDC_MINT, SOL_AMOUNT_LAMPORTS);
    const usdcOutAtomic = Number(solToUsdc.outAmount);
    const usdcOut = usdcOutAtomic / 10 ** USDC_DECIMALS;

    // USDC per SOL paid when buying USDC with SOL.
    const buyPrice = usdcOut / SOL_AMOUNT;

    // Quote 2: USDC -> SOL using the USDC received from quote 1.
    const usdcToSol = await fetchQuote(USDC_MINT, SOL_MINT, usdcOutAtomic);
    const solOutAtomic = Number(usdcToSol.outAmount);
    const solOut = solOutAtomic / 10 ** SOL_DECIMALS;

    // Effective USDC per SOL when selling back into SOL.
    const sellPrice = solOut > 0 ? usdcOut / solOut : 0;

    console.log(`Buy Price: ${buyPrice.toFixed(2)}`);
    console.log(`Sell Price: ${sellPrice.toFixed(2)}`);

    return { buyPrice, sellPrice };
  } catch (error) {
    console.error('Price fetch failed', error);
    return null;
  }
}
