"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulateAndSend = simulateAndSend;
const logger_1 = require("../utils/logger");
async function simulateAndSend({ connection, transaction, signer, }) {
    try {
        // Simulate
        const simResult = await connection.simulateTransaction(transaction);
        if (simResult.value.err) {
            (0, logger_1.error)('Simulation failed', simResult.value.err);
            return { success: false, error: simResult.value.err };
        }
        (0, logger_1.info)('Simulation successful');
        // Send
        const txid = await connection.sendTransaction(transaction, [signer]);
        (0, logger_1.info)('Transaction sent', txid);
        return { success: true, txid };
    }
    catch (e) {
        (0, logger_1.error)('Execution failed', e);
        return { success: false, error: e };
    }
}
