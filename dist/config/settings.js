"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOLANA_RPC_URL = exports.MAX_SLIPPAGE = exports.MIN_PROFIT_THRESHOLD = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.MIN_PROFIT_THRESHOLD = process.env.MIN_PROFIT_THRESHOLD ? Number(process.env.MIN_PROFIT_THRESHOLD) : 5; // USDC
exports.MAX_SLIPPAGE = process.env.MAX_SLIPPAGE ? Number(process.env.MAX_SLIPPAGE) / 100 : 0.003; // 0.3% as decimal
exports.SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || '';
