"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogLevel = void 0;
exports.log = log;
exports.info = info;
exports.warn = warn;
exports.error = error;
var LogLevel;
(function (LogLevel) {
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
function log(level, message, ...args) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}]`, message, ...args);
}
function info(message, ...args) {
    log(LogLevel.INFO, message, ...args);
}
function warn(message, ...args) {
    log(LogLevel.WARN, message, ...args);
}
function error(message, ...args) {
    log(LogLevel.ERROR, message, ...args);
}
