"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toBN = toBN;
exports.fromBN = fromBN;
exports.calculateProfit = calculateProfit;
const bn_js_1 = __importDefault(require("bn.js"));
function toBN(amount, decimals) {
    return new bn_js_1.default(Math.floor(amount * 10 ** decimals));
}
function fromBN(bn, decimals) {
    return bn.toNumber() / 10 ** decimals;
}
function calculateProfit({ sellAmount, buyAmount, flashLoanFee, dexFees, networkFees, }) {
    return sellAmount - buyAmount - flashLoanFee - dexFees - networkFees;
}
