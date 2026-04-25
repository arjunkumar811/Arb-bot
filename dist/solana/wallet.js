"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKeypair = getKeypair;
exports.getConnection = getConnection;
const web3_js_1 = require("@solana/web3.js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function getKeypair() {
    if (!process.env.PRIVATE_KEY)
        throw new Error('PRIVATE_KEY env not set');
    const secret = Uint8Array.from(JSON.parse(process.env.PRIVATE_KEY));
    return web3_js_1.Keypair.fromSecretKey(secret);
}
function getConnection() {
    if (!process.env.SOLANA_RPC_URL)
        throw new Error('SOLANA_RPC_URL env not set');
    return new web3_js_1.Connection(process.env.SOLANA_RPC_URL, 'confirmed');
}
