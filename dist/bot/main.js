"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const priceScanner_1 = require("./priceScanner");
const opportunityEngine_1 = require("./opportunityEngine");
const txBuilder_1 = require("./txBuilder");
const executor_1 = require("./executor");
const wallet_1 = require("../solana/wallet");
const tokens_json_1 = __importDefault(require("../config/tokens.json"));
const logger_1 = require("../utils/logger");
async function main() {
    const keypair = (0, wallet_1.getKeypair)();
    const connection = (0, wallet_1.getConnection)();
    while (true) {
        try {
            // 1. Fetch prices
            const prices = await (0, priceScanner_1.fetchPrices)();
            // 2. Detect opportunity
            const opportunity = (0, opportunityEngine_1.detectOpportunity)(prices);
            if (!opportunity.isProfitable) {
                await new Promise(res => setTimeout(res, 200));
                continue;
            }
            (0, logger_1.info)('Profitable opportunity found:', opportunity);
            // 3. Build transaction
            // For demo, use buy route then sell route
            const swapRoutes = [
                {
                // ...route for buy (SOL->USDC)
                },
                {
                // ...route for sell (USDC->SOL)
                },
            ];
            const tx = await (0, txBuilder_1.buildArbTransaction)({
                connection,
                userPublicKey: keypair.publicKey,
                flashLoanAmount: opportunity.buyAmount,
                flashLoanMint: tokens_json_1.default.USDC.mint,
                swapRoutes,
            });
            // 4. Simulate and execute
            const result = await (0, executor_1.simulateAndSend)({
                connection,
                transaction: tx,
                signer: keypair,
            });
            if (result.success) {
                (0, logger_1.info)('Arbitrage executed! TXID:', result.txid);
            }
            else {
                (0, logger_1.warn)('Transaction failed:', result.error);
            }
        }
        catch (e) {
            (0, logger_1.error)('Main loop error', e);
        }
        await new Promise(res => setTimeout(res, 200));
    }
}
main();
