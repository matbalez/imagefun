import { log } from './logging';
const globalKey = Symbol.for('mdk-checkout:payment-state');
function getGlobalPaymentState() {
    const globalObject = globalThis;
    if (!globalObject[globalKey]) {
        globalObject[globalKey] = {
            receivedPaymentHashes: new Set(),
        };
    }
    return globalObject[globalKey];
}
export function markPaymentReceived(paymentHash) {
    if (!paymentHash)
        return;
    const state = getGlobalPaymentState();
    state.receivedPaymentHashes.add(paymentHash);
}
export function hasPaymentBeenReceived(paymentHash) {
    if (!paymentHash)
        return false;
    log('hasPaymentBeenReceived. Checking payment received for', paymentHash);
    const state = getGlobalPaymentState();
    log('hasPaymentBeenReceived. Current received payments:', Array.from(state.receivedPaymentHashes));
    return state.receivedPaymentHashes.has(paymentHash);
}
export function clearPayment(paymentHash) {
    if (!paymentHash)
        return;
    const state = getGlobalPaymentState();
    state.receivedPaymentHashes.delete(paymentHash);
}
//# sourceMappingURL=payment-state.js.map