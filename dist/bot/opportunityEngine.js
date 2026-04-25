"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectOpportunity = detectOpportunity;
const math_1 = require("../utils/math");
const settings_1 = require("../config/settings");
const logger_1 = require("../utils/logger");
function detectOpportunity(prices) {
    // Example: buy SOL, sell USDC
    const buyAmount = prices.buyPrice;
    const sellAmount = prices.sellPrice;
    const flashLoanFee = 0.0003 * buyAmount; // Example fee
    const dexFees = 0.0005 * buyAmount; // Example DEX fee
    const networkFees = 0.0001 * buyAmount; // Example network fee
    const profit = (0, math_1.calculateProfit)({
        sellAmount,
        buyAmount,
        flashLoanFee,
        dexFees,
        networkFees,
    });
    const isProfitable = profit > settings_1.MIN_PROFIT_THRESHOLD;
    if (isProfitable) {
        (0, logger_1.info)('Opportunity detected', { profit, buyAmount, sellAmount });
    }
    return { profit, buyAmount, sellAmount, isProfitable };
}
