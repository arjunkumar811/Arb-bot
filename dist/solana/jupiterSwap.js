"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJupiterQuote = getJupiterQuote;
exports.getBestQuote = getBestQuote;
exports.getSwapInstructions = getSwapInstructions;
const api_1 = require("@jup-ag/api");
const jupiter = (0, api_1.createJupiterApiClient)();
async function getJupiterQuote(inputMint, outputMint, amount, slippage) {
    try {
        const res = await jupiter.quoteGet({
            inputMint,
            outputMint,
            amount,
            slippageBps: Math.floor(slippage * 10000),
            swapMode: 'ExactIn',
        });
        return res;
    }
    catch (e) {
        return null;
    }
}
// For compatibility with previous logic
async function getBestQuote(inputMint, outputMint, amount, slippage) {
    return getJupiterQuote(inputMint, outputMint, amount, slippage);
}
async function getSwapInstructions(quote, userPublicKey) {
    try {
        const res = await jupiter.swapInstructionsPost({
            swapRequest: {
                quoteResponse: quote,
                userPublicKey: userPublicKey.toBase58(),
            }
        });
        return res;
    }
    catch (e) {
        return null;
    }
}
