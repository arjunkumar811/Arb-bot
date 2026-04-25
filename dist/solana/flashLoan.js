"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFlashLoanInstructions = getFlashLoanInstructions;
const solend_sdk_1 = require("@solendprotocol/solend-sdk");
async function getFlashLoanInstructions(params) {
    const { connection, amount, tokenMint, userPublicKey, swapInstructions } = params;
    // Load Solend market
    const market = await solend_sdk_1.SolendMarket.initialize(connection);
    await market.loadReserves();
    const reserve = market.reserves.find(r => r.config.mintAddress === tokenMint);
    if (!reserve)
        throw new Error('Reserve not found for token');
    // Build borrow transaction (flash loan)
    const borrowAction = await solend_sdk_1.SolendAction.buildBorrowTxns(connection, amount.toString(), reserve.config.symbol, userPublicKey, 'production');
    const borrowTxns = await borrowAction.getTransactions();
    const borrowIxs = borrowTxns.lendingTxn ? borrowTxns.lendingTxn.instructions : [];
    // Build repay transaction
    const repayAction = await solend_sdk_1.SolendAction.buildRepayTxns(connection, amount.toString(), reserve.config.symbol, userPublicKey, 'production');
    const repayTxns = await repayAction.getTransactions();
    const repayIxs = repayTxns.lendingTxn ? repayTxns.lendingTxn.instructions : [];
    // Compose: borrow, swap(s), repay
    return [
        ...borrowIxs,
        ...swapInstructions,
        ...repayIxs
    ];
}
