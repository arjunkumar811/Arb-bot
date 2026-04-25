"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildArbTransaction = buildArbTransaction;
const web3_js_1 = require("@solana/web3.js");
const flashLoan_1 = require("../solana/flashLoan");
const jupiterSwap_1 = require("../solana/jupiterSwap");
const logger_1 = require("../utils/logger");
async function buildArbTransaction({ connection, userPublicKey, flashLoanAmount, flashLoanMint, swapRoutes, }) {
    try {
        // Build swap instructions
        const swapInstructions = [];
        for (const quote of swapRoutes) {
            const swapIxsRes = await (0, jupiterSwap_1.getSwapInstructions)(quote, userPublicKey);
            if (swapIxsRes && swapIxsRes.swapInstruction) {
                // Convert Jupiter's instruction format to TransactionInstruction if needed
                // Here, you may need to use web3.js to decode the instruction if not already a TransactionInstruction
                // For now, we assume swapIxsRes.swapInstruction is a TransactionInstruction or compatible
                swapInstructions.push(swapIxsRes.swapInstruction);
            }
        }
        // Build flash loan instructions (borrow, swap, repay)
        const flashLoanIxs = await (0, flashLoan_1.getFlashLoanInstructions)({
            connection,
            amount: flashLoanAmount,
            tokenMint: flashLoanMint,
            userPublicKey,
            swapInstructions,
        });
        // Compose transaction
        const tx = new web3_js_1.Transaction();
        for (const ix of flashLoanIxs)
            tx.add(ix);
        (0, logger_1.info)('Transaction built with', flashLoanIxs.length, 'instructions');
        return tx;
    }
    catch (e) {
        (0, logger_1.error)('Failed to build transaction', e);
        throw e;
    }
}
