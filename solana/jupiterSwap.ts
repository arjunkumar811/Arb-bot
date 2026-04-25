import { createJupiterApiClient, QuoteResponse, SwapInstructionsResponse } from '@jup-ag/api';
import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';


const jupiter = createJupiterApiClient();

export async function getJupiterQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippage: number
): Promise<QuoteResponse | null> {
  try {
    const res = await jupiter.quoteGet({
      inputMint,
      outputMint,
      amount,
      slippageBps: Math.floor(slippage * 10000),
      swapMode: 'ExactIn',
    });
    return res;
  } catch (e) {
    return null;
  }
}


// For compatibility with previous logic
export async function getBestQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippage: number
): Promise<QuoteResponse | null> {
  return getJupiterQuote(inputMint, outputMint, amount, slippage);
}


export async function getSwapInstructions(
  quote: QuoteResponse,
  userPublicKey: PublicKey
): Promise<SwapInstructionsResponse | null> {
  try {
    const res = await jupiter.swapInstructionsPost({
      swapRequest: {
        quoteResponse: quote,
        userPublicKey: userPublicKey.toBase58(),
      }
    });
    return res;
  } catch (e) {
    return null;
  }
}
