"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPrices = fetchPrices;
const jupiterSwap_1 = require("../solana/jupiterSwap");
const tokens_json_1 = __importDefault(require("../config/tokens.json"));
const logger_1 = require("../utils/logger");
async function fetchPrices() {
    var _a, _b, _c, _d, _e, _f;
    try {
        const amount = 1 * 10 ** tokens_json_1.default.SOL.decimals; // 1 SOL
        const slippage = 0.003;
        // SOL -> USDC
        const solToUsdcQuote = await (0, jupiterSwap_1.getJupiterQuote)(tokens_json_1.default.SOL.mint, tokens_json_1.default.USDC.mint, amount, slippage);
        // USDC -> SOL
        const usdcToSolQuote = await (0, jupiterSwap_1.getJupiterQuote)(tokens_json_1.default.USDC.mint, tokens_json_1.default.SOL.mint, 100 * 10 ** tokens_json_1.default.USDC.decimals, // 100 USDC
        slippage);
        return {
            buyPrice: (solToUsdcQuote === null || solToUsdcQuote === void 0 ? void 0 : solToUsdcQuote.outAmount) ? Number(solToUsdcQuote.outAmount) : 0,
            sellPrice: (usdcToSolQuote === null || usdcToSolQuote === void 0 ? void 0 : usdcToSolQuote.outAmount) ? Number(usdcToSolQuote.outAmount) : 0,
            buyLiquidity: ((_c = (_b = (_a = solToUsdcQuote === null || solToUsdcQuote === void 0 ? void 0 : solToUsdcQuote.routePlan) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.swapInfo) === null || _c === void 0 ? void 0 : _c.inAmount) ? Number(solToUsdcQuote.routePlan[0].swapInfo.inAmount) : 0,
            sellLiquidity: ((_f = (_e = (_d = usdcToSolQuote === null || usdcToSolQuote === void 0 ? void 0 : usdcToSolQuote.routePlan) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.swapInfo) === null || _f === void 0 ? void 0 : _f.inAmount) ? Number(usdcToSolQuote.routePlan[0].swapInfo.inAmount) : 0,
        };
    }
    catch (e) {
        (0, logger_1.error)('Failed to fetch prices', e);
        return {
            buyPrice: 0,
            sellPrice: 0,
            buyLiquidity: 0,
            sellLiquidity: 0,
        };
    }
}
